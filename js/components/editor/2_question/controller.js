import { getSelectedTopic } from '../1_topic/controller.js';
import { topicEditorDom } from '../1_topic/dom.js';
import {
  selectQuestion as publishQuestionSelection,
  requestQuestionPreviewRefresh,
  subscribeToTopicSelection,
} from '../editorCoordinator.js';
import {
  moveQuestionToTopic,
  removeQuestion,
  upsertQuestion,
} from '../../../appState.js';
import {
  clearDialogError,
  closeDialog,
  confirmDeletion,
  showDialogError,
} from '../../../ui/dialog.js';
import { notify } from '../../../ui/notifications.js';
import {
  questionEditorDom,
  initQuestionEditorDom,
  renderQuestionFormFor,
  renderQuestionOptions,
  getClickedQuestionId,
  setQuestionSelectedState,
} from './dom.js';
import {
  clearExplorerDragState,
  getExplorerDragId,
  markExplorerDropTarget,
  startExplorerDrag,
  supportsExplorerDrag,
} from '../shared/explorerDragDrop.js';

const ISSUE_DRAG_TYPE = 'application/x-eagle-eye-question';

export function initQuestionEditor() {
  initQuestionEditorDom();

  questionEditorDom.saveQuestionBtn.addEventListener('click', onSaveQuestion);
  questionEditorDom.createQuestionBtn.addEventListener('click', onCreateQuestion);
  questionEditorDom.questionList.addEventListener('click', onQuestionClick);
  questionEditorDom.questionList.addEventListener('dblclick', onQuestionDblClick);
  questionEditorDom.questionList.addEventListener('dragstart', onQuestionDragStart);
  questionEditorDom.questionList.addEventListener('dragend', clearExplorerDragState);

  topicEditorDom.topicList.addEventListener('dragover', onTopicDragOver);
  topicEditorDom.topicList.addEventListener('dragleave', onTopicDragLeave);
  topicEditorDom.topicList.addEventListener('drop', onTopicDrop);
  subscribeToTopicSelection(handleTopicSelection);
}

/** Event Listener Functions */

function onQuestionClick(event) {
  const questionId = getClickedQuestionId(event);

  if (!questionId) {
    return;
  }

  // deletion
  if (event.target.closest('.decision-explorer__delete')) {
    if (
      !confirmDeletion(
        'question',
        'This also removes its leading questions, rules, and answers.',
      )
    ) {
      return;
    }
    const topicId = getSelectedTopic();
    removeQuestion(questionId);
    renderQuestionOptions(topicId);
    setDomQuestionValue('');
    publishQuestionSelection('');
    requestQuestionPreviewRefresh();
    notify('Question deleted. Download to save changes.', 'success');
    return;
  }

  selectQuestion(questionId);
  publishQuestionSelection(questionId);
  requestQuestionPreviewRefresh();
}

function onQuestionDblClick(event) {
  // stop if the user intended to delete instead
  if (event.target.closest('.decision-explorer__delete')) return;

  const questionId = getClickedQuestionId(event);

  if (!questionId) {
    return;
  }

  selectQuestionForEditing(questionId);
  questionEditorDom.questionDialog.showModal();
}

/** Shared Functions */

export function setDomQuestionValue(value) {
  questionEditorDom.questionSelect.value = value;
  setQuestionSelectedState(value);
}

function handleTopicSelection(topicId) {
  renderQuestionOptions(topicId);
  clearQuestionForm();
  setDomQuestionValue('');
  publishQuestionSelection('');
  requestQuestionPreviewRefresh();
}

export function selectQuestion(questionId) {
  setDomQuestionValue(questionId);
}

export function clearQuestionForm() {
  renderQuestionFormFor('__new__');
}

/** Internal Functions */

function onSaveQuestion() {
  try {
    const topic_id = getSelectedTopic();
    const question_id = questionEditorDom.questionId.value;

    upsertQuestion({
      question_id: question_id,
      topic_id: topic_id,
      question_name: questionEditorDom.questionName.value,
      question_description: questionEditorDom.questionDescription.value,
      example_phrases: questionEditorDom.questionExamples.value,
    });

    notify('Saved question. Download to see changes.', 'success');

    closeDialog(questionEditorDom.questionDialog);

    renderQuestionOptions(topic_id);
    setDomQuestionValue('');
    publishQuestionSelection('');
    requestQuestionPreviewRefresh();
  } catch (error) {
    showDialogError(questionEditorDom.questionDialog, error.message);
  }
}

/** LeadingQuestion related functions */

export function getSelectedQuestion() {
  return questionEditorDom.questionSelect.value;
}

function onCreateQuestion() {
  if (!getSelectedTopic()) {
    notify('Select a topic before creating an question.', 'error');
    return;
  }

  selectQuestionForEditing('__new__');
  questionEditorDom.questionDialog.showModal();
}

function selectQuestionForEditing(questionId) {
  clearDialogError(questionEditorDom.questionDialog);
  selectQuestion(questionId);
  renderQuestionFormFor(questionId);
}

function onQuestionDragStart(event) {
  startExplorerDrag(event, getClickedQuestionId(event), ISSUE_DRAG_TYPE);
}

/** Drag and Drop Functions */

function onTopicDragOver(event) {
  const target = event.target.closest('[data-topic-id]');
  if (!target || !supportsExplorerDrag(event, ISSUE_DRAG_TYPE)) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  markExplorerDropTarget(topicEditorDom.topicList, target);
}

function onTopicDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  clearExplorerDragState();
}

function onTopicDrop(event) {
  const target = event.target.closest('[data-topic-id]');
  const draggedQuestionId = getExplorerDragId(event, ISSUE_DRAG_TYPE);
  clearExplorerDragState();
  if (!target || !draggedQuestionId) return;

  event.preventDefault();
  try {
    const movedQuestion = moveQuestionToTopic(draggedQuestionId, target.dataset.topicId);
    handleTopicSelection(getSelectedTopic());
    notify(
      `Moved ${movedQuestion.question_name}. Download to save changes.`,
      'success',
    );
  } catch (error) {
    notify(error.message, 'error');
  }
}