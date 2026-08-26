import { getSelectedQuestion } from '../2_question/controller.js';
import {
  clearDialogError,
  closeDialog,
  confirmDeletion,
  showDialogError,
} from '../../../ui/dialog.js';
import { notify } from '../../../ui/notifications.js';
import { deleteAnswer } from '../../../appState.js';
import {
  requestQuestionPreviewRefresh,
  subscribeToQuestionSelection,
} from '../editorCoordinator.js';
import {
  addAnswerAssignment,
  collectAnswerAssignments,
  getClickedAnswerId,
  handleAnswerAssignmentChange,
  handleAnswerAssignmentClick,
  initRecomEditorDom,
  recomEditorDom,
  renderAnswerFormFor,
  renderAnswerOptions,
  setAnswerSelectedState,
} from './dom.js';
import {
  saveAnswer,
  saveAnswerAssignments,
  validateAnswerAssignments,
} from '../../../services/answerService.js';

export function initRecomEditor() {
  initRecomEditorDom();
  recomEditorDom.createAnswerBtn.addEventListener(
    'click',
    onCreateAnswer,
  );
  recomEditorDom.recommList.addEventListener('click', onAnswerClick);
  recomEditorDom.recommList.addEventListener(
    'dblclick',
    onAnswerDoubleClick,
  );
  recomEditorDom.saveAnswerBtn.addEventListener(
    'click',
    onSaveAnswer,
  );
  recomEditorDom.addAnswerAssignmentBtn.addEventListener(
    'click',
    addAnswerAssignment,
  );
  recomEditorDom.answerAssignments.addEventListener(
    'click',
    handleAnswerAssignmentClick,
  );
  recomEditorDom.answerAssignments.addEventListener(
    'change',
    handleAnswerAssignmentChange,
  );
  renderAnswerOptions('');
  subscribeToQuestionSelection(refreshAnswers);
}

/** Shared Functions */

export function refreshAnswers(questionId) {
  renderAnswerOptions(questionId);
  setAnswerSelectedState('');
}

/** Event Listener Functions */

function onCreateAnswer() {
  clearDialogError(recomEditorDom.recommDialog);
  renderAnswerFormFor('__new__', getSelectedQuestion());
  recomEditorDom.recommDialog.showModal();
}

function onAnswerClick(event) {
  const answerId = getClickedAnswerId(event);
  if (!answerId) return;

  // deletion
  if (event.target.closest('.decision-explorer__delete')) {
    if (
      !confirmDeletion(
        'answer',
        'This also removes its matching rules.',
      )
    ) {
      return;
    }
    deleteAnswer(answerId);
    const questionId = getSelectedQuestion();
    renderAnswerOptions(questionId);
    setAnswerSelectedState('');
    requestQuestionPreviewRefresh();
    notify('Answer deleted. Download to save changes.', 'success');
    return;
  }

  recomEditorDom.recommSelect.value = answerId;
  setAnswerSelectedState(answerId);
}

function onAnswerDoubleClick(event) {
  // stop if the user intended to delete instead
  if (event.target.closest('.decision-explorer__delete')) return;

  const answerId = getClickedAnswerId(event);
  if (!answerId) return;
  recomEditorDom.recommSelect.value = answerId;
  setAnswerSelectedState(answerId);
  clearDialogError(recomEditorDom.recommDialog);
  renderAnswerFormFor(answerId, getSelectedQuestion());
  recomEditorDom.recommDialog.showModal();
}

/** Internal Functions */

function onSaveAnswer() {
  try {
    const questionId = getSelectedQuestion();
    const assignments = collectAnswerAssignments();
    validateAnswerAssignments(
      questionId,
      recomEditorDom.answerId.value,
      assignments,
    );
    const answer = saveAnswer({
      answerId: recomEditorDom.answerId.value,
      finalDecision: recomEditorDom.answerDecision.value,
      answerText: recomEditorDom.answerText.value,
      nextSteps: recomEditorDom.answerNextSteps.value,
      escalationNote: recomEditorDom.answerEscalationNote.value,
    });
    const assignmentCount = saveAssignmentsForSelectedQuestion(
      questionId,
      answer.answer_id,
      assignments,
    );

    renderAnswerOptions(questionId);
    recomEditorDom.recommSelect.value = '';
    setAnswerSelectedState('');
    closeDialog(recomEditorDom.recommDialog);
    requestQuestionPreviewRefresh();
    notify(getAnswerSavedMessage(questionId, assignmentCount), 'success');
  } catch (error) {
    showDialogError(recomEditorDom.recommDialog, error.message);
  }
}

function saveAssignmentsForSelectedQuestion(
  questionId,
  answerId,
  assignments,
) {
  if (!questionId) return 0;
  return saveAnswerAssignments(questionId, answerId, assignments);
}

function getAnswerSavedMessage(questionId, assignmentCount) {
  if (!questionId) return 'Saved.';

  return `Saved with ${assignmentCount} assignment(s). Download to see changes.`;
}
