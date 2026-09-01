import { getSelectedQuestion } from '../2_question/controller.js';
import { questionEditorDom } from '../2_question/dom.js';
import {
  initParamEditorDom,
  paramEditorDom,
  renderParamFormFor,
  renderParamOptions,
  getClickedParamId,
  setParamSelectedState,
} from './dom.js';
import {
  moveLeadingQuestionToQuestion,
  removeLeadingQuestion,
  upsertLeadingQuestion,
} from '../../../appState.js';
import {
  clearDialogError,
  closeDialog,
  confirmDeletion,
  showDialogError,
} from '../../../ui/dialog.js';
import { notify } from '../../../ui/notifications.js';
import {
  selectQuestion as publishQuestionSelection,
  requestQuestionPreviewRefresh,
  subscribeToQuestionSelection,
} from '../editorCoordinator.js';
import {
  clearExplorerDragState,
  getExplorerDragId,
  markExplorerDropTarget,
  startExplorerDrag,
  supportsExplorerDrag,
} from '../shared/explorerDragDrop.js';

const PARAMETER_DRAG_TYPE = 'application/x-eagle-eye-leadingQuestion';

export function initParamEditor() {
  initParamEditorDom();

  paramEditorDom.saveLeadingQuestionBtn.addEventListener('click', onSaveLeadingQuestion);
  paramEditorDom.createParamBtn.addEventListener('click', onCreateParam);
  paramEditorDom.paramList.addEventListener('click', onParamClick);
  paramEditorDom.paramList.addEventListener('dblclick', onParamDblClick);
  paramEditorDom.paramList.addEventListener('dragstart', onParamDragStart);
  paramEditorDom.paramList.addEventListener('dragend', clearExplorerDragState);

  questionEditorDom.questionList.addEventListener('dragover', onQuestionDragOver);
  questionEditorDom.questionList.addEventListener('dragleave', onQuestionDragLeave);
  questionEditorDom.questionList.addEventListener('drop', onQuestionDrop);
  subscribeToQuestionSelection(handleQuestionSelection);
}

/** Shared Functions */

export function clearParamForm() {
  renderParamFormFor('__new__', getSelectedQuestion());
}

/** Event Listener Functions */

export function onParamClick(event) {
  const paramId = getClickedParamId(event);

  if (!paramId) {
    return;
  }

  // deletion
  if (event.target.closest('.decision-explorer__delete')) {
    if (
      !confirmDeletion(
        'leadingQuestion',
        'This also removes rules and answers that depend on it.',
      )
    ) {
      return;
    }
    const questionId = getSelectedQuestion();
    removeLeadingQuestion(paramId);
    renderParamOptions(questionId);
    setDomParamValue('');
    publishQuestionSelection(questionId);
    requestQuestionPreviewRefresh();
    notify('LeadingQuestion deleted. Download to save changes.', 'success');
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

  selectLeadingQuestionForEditing(paramId);
  paramEditorDom.paramDialog.showModal();
}

/** Question related functions */

export function setDomParamValue(value) {
  paramEditorDom.paramSelect.value = value;
  setParamSelectedState(value);
}

function handleQuestionSelection(questionId) {
  renderParamOptions(questionId);
  clearParamForm();
  setDomParamValue('');
}

export function selectLeadingQuestion(paramId) {
  setDomParamValue(paramId);
}

/** Internal Functions */

function onSaveLeadingQuestion() {
  try {
    const question_id = getSelectedQuestion();
    const param_id = paramEditorDom.leadingQuestionId.value;

    upsertLeadingQuestion({
      question_id: question_id,
      leadingQuestion_id: param_id,
      leadingQuestion_name: paramEditorDom.leadingQuestionName.value,
      question_to_ask: paramEditorDom.leadingQuestionQuestion.value,
      required: paramEditorDom.leadingQuestionRequired.value,
      allowed_values: paramEditorDom.leadingQuestionAllowedValues.value,
      example_values: paramEditorDom.leadingQuestionExampleValues.value,
      order: paramEditorDom.leadingQuestionOrder.value,
    });

    selectLeadingQuestion(param_id);
    renderParamOptions(question_id);

    closeDialog(paramEditorDom.paramDialog);

    notify('Saved leading question. Download to see changes.', 'success');
  } catch (error) {
    showDialogError(paramEditorDom.paramDialog, error.message);
  }
}

function onCreateParam() {
  if (!getSelectedQuestion()) {
    notify('Select an question before creating a leading question.', 'error');
    return;
  }

  selectLeadingQuestionForEditing('__new__');
  paramEditorDom.paramDialog.showModal();
}

function selectLeadingQuestionForEditing(paramId) {
  clearDialogError(paramEditorDom.paramDialog);
  selectLeadingQuestion(paramId);
  renderParamFormFor(paramId, getSelectedQuestion());
}

function onParamDragStart(event) {
  startExplorerDrag(event, getClickedParamId(event), PARAMETER_DRAG_TYPE);
}

/** Drag and Drop Functions */

function onQuestionDragOver(event) {
  const target = event.target.closest('[data-question-id]');
  if (!target || !supportsExplorerDrag(event, PARAMETER_DRAG_TYPE)) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  markExplorerDropTarget(questionEditorDom.questionList, target);
}

function onQuestionDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  clearExplorerDragState();
}

function onQuestionDrop(event) {
  const target = event.target.closest('[data-question-id]');
  const draggedLeadingQuestionId = getExplorerDragId(event, PARAMETER_DRAG_TYPE);
  clearExplorerDragState();
  if (!target || !draggedLeadingQuestionId) return;

  event.preventDefault();
  try {
    const movedLeadingQuestion = moveLeadingQuestionToQuestion(
      draggedLeadingQuestionId,
      target.dataset.questionId,
    );
    handleQuestionSelection(getSelectedQuestion());
    notify(
      `Moved ${movedLeadingQuestion.leadingQuestion_name}. Rules using this leadingQuestion were removed. Download to save changes.`,
      'success',
    );
  } catch (error) {
    notify(error.message, 'error');
  }
}
