import { getSelectedIssue } from '../2_issue/controller.js';
import { issueEditorDom } from '../2_issue/dom.js';
import {
  initParamEditorDom,
  paramEditorDom,
  renderParamFormFor,
  renderParamOptions,
  getClickedParamId,
  setParamSelectedState,
} from './dom.js';
import {
  moveParameterToIssue,
  removeParameter,
  upsertParameter,
} from '../../../appState.js';
import { closeDialog } from '../../../ui/dialog.js';
import { notify } from '../../../ui/notifications.js';
import {
  selectIssue as publishIssueSelection,
  requestIssuePreviewRefresh,
  subscribeToIssueSelection,
} from '../editorCoordinator.js';
import {
  clearExplorerDragState,
  getExplorerDragId,
  markExplorerDropTarget,
  startExplorerDrag,
  supportsExplorerDrag,
} from '../shared/explorerDragDrop.js';

const PARAMETER_DRAG_TYPE = 'application/x-eagle-eye-parameter';

export function initParamEditor() {
  initParamEditorDom();

  paramEditorDom.saveParameterBtn.addEventListener('click', onSaveParameter);
  paramEditorDom.createParamBtn.addEventListener('click', onCreateParam);
  paramEditorDom.paramSearch.addEventListener('input', () =>
    renderParamOptions(getSelectedIssue()),
  );

  paramEditorDom.paramList.addEventListener('click', onParamClick);
  paramEditorDom.paramList.addEventListener('dblclick', onParamDblClick);
  paramEditorDom.paramList.addEventListener('dragstart', onParamDragStart);
  paramEditorDom.paramList.addEventListener('dragend', clearExplorerDragState);

  issueEditorDom.issueList.addEventListener('dragover', onIssueDragOver);
  issueEditorDom.issueList.addEventListener('dragleave', onIssueDragLeave);
  issueEditorDom.issueList.addEventListener('drop', onIssueDrop);
  subscribeToIssueSelection(handleIssueSelection);
}

/** Shared Functions */

export function clearParamForm() {
  renderParamFormFor('__new__', getSelectedIssue());
}

/** Event Listener Functions */

export function onParamClick(event) {
  const paramId = getClickedParamId(event);

  if (!paramId) {
    return;
  }

  // deletion
  if (event.target.closest('.decision-explorer__delete')) {
    const issueId = getSelectedIssue();
    removeParameter(paramId);
    renderParamOptions(issueId);
    setDomParamValue('');
    publishIssueSelection(issueId);
    requestIssuePreviewRefresh();
    notify('Parameter deleted. Download to save changes.', 'success');
    return;
  }

  setDomParamValue(paramId);
}

function onParamDblClick(event) {
  // stop if the user intended to delete instead
  if (event.target.closest('.decision-explorer__delete')) return;

  const paramId = getClickedParamId(event);

  if (!paramId) {
    return;
  }

  selectParameterForEditing(paramId);
  paramEditorDom.paramDialog.showModal();
}

/** Issue related functions */

export function setDomParamValue(value) {
  paramEditorDom.paramSelect.value = value;
  setParamSelectedState(value);
}

function handleIssueSelection(issueId) {
  renderParamOptions(issueId);
  clearParamForm();
  setDomParamValue('');
}

export function selectParameter(paramId) {
  setDomParamValue(paramId);
}

/** Internal Functions */

function onSaveParameter() {
  try {
    const issue_id = getSelectedIssue();
    const param_id = paramEditorDom.parameterId.value;

    upsertParameter({
      issue_id: issue_id,
      parameter_id: param_id,
      parameter_name: paramEditorDom.parameterName.value,
      question_to_ask: paramEditorDom.parameterQuestion.value,
      required: paramEditorDom.parameterRequired.value,
      allowed_values: paramEditorDom.parameterAllowedValues.value,
      example_values: paramEditorDom.parameterExampleValues.value,
      order: paramEditorDom.parameterOrder.value,
    });

    selectParameter(param_id);
    renderParamOptions(issue_id);

    closeDialog(paramEditorDom.paramDialog);

    notify('Saved parameter. Download to see changes.', 'success');
  } catch (error) {
    notify(error.message, 'error');
  }
}

function onCreateParam() {
  if (!getSelectedIssue()) {
    notify('Select an issue before creating a parameter.', 'error');
    return;
  }

  selectParameterForEditing('__new__');
  paramEditorDom.paramDialog.showModal();
}

function selectParameterForEditing(paramId) {
  selectParameter(paramId);
  renderParamFormFor(paramId, getSelectedIssue());
}

function onParamDragStart(event) {
  startExplorerDrag(event, getClickedParamId(event), PARAMETER_DRAG_TYPE);
}

/** Drag and Drop Functions */

function onIssueDragOver(event) {
  const target = event.target.closest('[data-issue-id]');
  if (!target || !supportsExplorerDrag(event, PARAMETER_DRAG_TYPE)) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  markExplorerDropTarget(issueEditorDom.issueList, target);
}

function onIssueDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  clearExplorerDragState();
}

function onIssueDrop(event) {
  const target = event.target.closest('[data-issue-id]');
  const draggedParameterId = getExplorerDragId(event, PARAMETER_DRAG_TYPE);
  clearExplorerDragState();
  if (!target || !draggedParameterId) return;

  event.preventDefault();
  try {
    const movedParameter = moveParameterToIssue(
      draggedParameterId,
      target.dataset.issueId,
    );
    handleIssueSelection(getSelectedIssue());
    notify(
      `Moved ${movedParameter.parameter_name}. Rules using this parameter were removed. Download to save changes.`,
      'success',
    );
  } catch (error) {
    notify(error.message, 'error');
  }
}
