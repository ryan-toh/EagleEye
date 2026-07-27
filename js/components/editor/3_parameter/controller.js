import { getSelectedIssue } from '../2_issue/controller.js';
import { issueEditorDom } from '../2_issue/dom.js';
import {
  initParamEditorDom,
  paramEditorDom,
  renderParameterPicker,
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
import {
  setEditorStatus,
  closeDialog,
  renderSelectedIssuePreview,
} from '../shared/controller.js';
import { refreshRecommendations } from '../4_recommendationMatrix/controller.js';

export function initParamEditor() {
  initParamEditorDom();

  paramEditorDom.parameterPicker.addEventListener('change', onParamPicked);
  paramEditorDom.saveParameterBtn.addEventListener('click', onSaveParameter);
  paramEditorDom.createParamBtn.addEventListener('click', onCreateParam);
  paramEditorDom.paramSearch.addEventListener('input', () =>
    renderParamOptions(getSelectedIssue()),
  );

  paramEditorDom.paramList.addEventListener('click', onParamClick);
  paramEditorDom.paramList.addEventListener('dblclick', onParamDblClick);
  paramEditorDom.paramList.addEventListener('dragstart', onParamDragStart);
  paramEditorDom.paramList.addEventListener('dragend', clearDragState);

  issueEditorDom.issueList.addEventListener('dragover', onIssueDragOver);
  issueEditorDom.issueList.addEventListener('dragleave', onIssueDragLeave);
  issueEditorDom.issueList.addEventListener('drop', onIssueDrop);
}

export function refreshParamPicker(issueId) {
  renderParameterPicker(issueId);
}

export function refreshParam(issueId) {
  handleIssueSelection(issueId);
}

export function clearParamForm() {
  renderParamFormFor('__new__', getSelectedIssue());
}

export function onParamClick(event) {
  const paramId = getClickedParamId(event);

  if (!paramId) {
    return;
  }

  if (event.target.closest('.decision-explorer__delete')) {
    const issueId = getSelectedIssue();
    removeParameter(paramId);
    renderParameterPicker(issueId);
    renderParamOptions(issueId);
    setDomParamValue('');
    refreshRecommendations(issueId);
    void renderSelectedIssuePreview();
    setEditorStatus('Parameter deleted. Download to save changes.', 'success');
    return;
  }

  setDomParamValue(paramId);
}

function onParamDblClick(event) {
  if (event.target.closest('.decision-explorer__delete')) return;

  const paramId = getClickedParamId(event);

  if (!paramId) {
    return;
  }

  selectParameterForEditing(paramId);
  paramEditorDom.paramDialog.showModal();
}

export function setDomParamValue(value) {
  paramEditorDom.paramSelect.value = value;
  setParamSelectedState(value);
}

export function handleIssueSelection(issueId) {
  renderParamOptions(issueId);
  renderParameterPicker(issueId);
  clearParamForm();
  setDomParamValue('');
  refreshRecommendations(issueId);
}

export function selectParameter(paramId) {
  paramEditorDom.parameterPicker.value = paramId;
  setDomParamValue(paramId);
}

export function setParamOptions(issueId) {
  renderParamOptions(issueId);
}

export function onParamPicked() {
  const paramId = paramEditorDom.parameterPicker.value;

  renderParamFormFor(paramId, getSelectedIssue());
  setDomParamValue(paramId === '__new__' ? '' : paramId);
}

export function setParamForm(paramId) {
  renderParamFormFor(paramId, getSelectedIssue());
}

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

    renderParameterPicker(issue_id);
    selectParameter(param_id);
    renderParamOptions(issue_id);

    closeDialog(paramEditorDom.paramDialog);

    setEditorStatus('Saved parameter. Download to see changes.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function onCreateParam() {
  if (paramEditorDom.parameterPicker.disabled) {
    setEditorStatus('Select an issue before creating a parameter.', 'error');
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
  const paramId = getClickedParamId(event);
  if (!paramId) return;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-eagle-eye-parameter', paramId);
  event.target.closest('.decision-explorer__row')?.classList.add('is-dragging');
}

function onIssueDragOver(event) {
  const target = event.target.closest('[data-issue-id]');
  if (!target || !hasDragType(event, 'parameter')) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  issueEditorDom.issueList
    .querySelectorAll('.is-drop-target')
    .forEach((row) => row.classList.remove('is-drop-target'));
  target.closest('.decision-explorer__row')?.classList.add('is-drop-target');
}

function onIssueDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  clearDragState();
}

function onIssueDrop(event) {
  const target = event.target.closest('[data-issue-id]');
  const draggedParameterId = event.dataTransfer.getData(
    'application/x-eagle-eye-parameter',
  );
  clearDragState();
  if (!target || !draggedParameterId) return;

  event.preventDefault();
  try {
    const movedParameter = moveParameterToIssue(
      draggedParameterId,
      target.dataset.issueId,
    );
    handleIssueSelection(getSelectedIssue());
    setEditorStatus(
      `Moved ${movedParameter.parameter_name}. Rules using this parameter were removed. Download to save changes.`,
      'success',
    );
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function hasDragType(event, type) {
  return (
    type === 'parameter' &&
    event.dataTransfer.types.includes('application/x-eagle-eye-parameter')
  );
}

function clearDragState() {
  document
    .querySelectorAll(
      '.decision-explorer__row.is-dragging, .decision-explorer__row.is-drop-target',
    )
    .forEach((row) => row.classList.remove('is-dragging', 'is-drop-target'));
}
