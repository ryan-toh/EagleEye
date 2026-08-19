import { getSelectedIssue } from '../2_issue/controller.js';
import { closeDialog } from '../../../ui/dialog.js';
import { notify } from '../../../ui/notifications.js';
import { deleteRecommendation } from '../../../appState.js';
import {
  requestIssuePreviewRefresh,
  subscribeToIssueSelection,
} from '../editorCoordinator.js';
import {
  addRecommendationAssignment,
  collectRecommendationAssignments,
  getClickedRecommendationId,
  handleRecommendationAssignmentChange,
  handleRecommendationAssignmentClick,
  initRecomEditorDom,
  recomEditorDom,
  renderRecommendationFormFor,
  renderRecommendationOptions,
  setRecommendationSelectedState,
} from './dom.js';
import {
  saveRecommendation,
  saveRecommendationAssignments,
} from '../../../services/recommendationService.js';

export function initRecomEditor() {
  initRecomEditorDom();
  recomEditorDom.createRecommendationBtn.addEventListener(
    'click',
    onCreateRecommendation,
  );
  recomEditorDom.recommSearch.addEventListener('input', () =>
    renderRecommendationOptions(getSelectedIssue()),
  );
  recomEditorDom.recommList.addEventListener('click', onRecommendationClick);
  recomEditorDom.recommList.addEventListener(
    'dblclick',
    onRecommendationDoubleClick,
  );
  recomEditorDom.saveRecommendationBtn.addEventListener(
    'click',
    onSaveRecommendation,
  );
  recomEditorDom.addRecommendationAssignmentBtn.addEventListener(
    'click',
    addRecommendationAssignment,
  );
  recomEditorDom.recommendationAssignments.addEventListener(
    'click',
    handleRecommendationAssignmentClick,
  );
  recomEditorDom.recommendationAssignments.addEventListener(
    'change',
    handleRecommendationAssignmentChange,
  );
  renderRecommendationOptions('');
  subscribeToIssueSelection(refreshRecommendations);
}

/** Shared Functions */

export function refreshRecommendations(issueId) {
  renderRecommendationOptions(issueId);
  setRecommendationSelectedState('');
}

/** Event Listener Functions */

function onCreateRecommendation() {
  renderRecommendationFormFor('__new__', getSelectedIssue());
  recomEditorDom.recommDialog.showModal();
}

function onRecommendationClick(event) {
  const recommendationId = getClickedRecommendationId(event);
  if (!recommendationId) return;

  // deletion
  if (event.target.closest('.decision-explorer__delete')) {
    deleteRecommendation(recommendationId);
    const issueId = getSelectedIssue();
    renderRecommendationOptions(issueId);
    setRecommendationSelectedState('');
    requestIssuePreviewRefresh();
    notify(
      'Recommendation deleted. Download to save changes.',
      'success',
    );
    return;
  }

  recomEditorDom.recommSelect.value = recommendationId;
  setRecommendationSelectedState(recommendationId);
}

function onRecommendationDoubleClick(event) {
  // stop if the user intended to delete instead
  if (event.target.closest('.decision-explorer__delete')) return;

  const recommendationId = getClickedRecommendationId(event);
  if (!recommendationId) return;
  recomEditorDom.recommSelect.value = recommendationId;
  setRecommendationSelectedState(recommendationId);
  renderRecommendationFormFor(recommendationId, getSelectedIssue());
  recomEditorDom.recommDialog.showModal();
}

/** Internal Functions */

function onSaveRecommendation() {
  try {
    const recommendation = saveRecommendation({
      recommendationId: recomEditorDom.recommendationId.value,
      finalDecision: recomEditorDom.recommendationDecision.value,
      recommendationText: recomEditorDom.recommendationText.value,
      nextSteps: recomEditorDom.recommendationNextSteps.value,
      escalationNote: recomEditorDom.recommendationEscalationNote.value,
    });
    const issueId = getSelectedIssue();
    const assignmentCount = saveAssignmentsForSelectedIssue(
      issueId,
      recommendation.recommendation_id,
    );

    renderRecommendationOptions(issueId);
    recomEditorDom.recommSelect.value = '';
    setRecommendationSelectedState('');
    closeDialog(recomEditorDom.recommDialog);
    requestIssuePreviewRefresh();
    notify(getRecommendationSavedMessage(issueId, assignmentCount), 'success');
  } catch (error) {
    notify(error.message, 'error');
  }
}

function saveAssignmentsForSelectedIssue(issueId, recommendationId) {
  if (!issueId) return 0;

  const assignments = collectRecommendationAssignments();
  return saveRecommendationAssignments(issueId, recommendationId, assignments);
}

function getRecommendationSavedMessage(issueId, assignmentCount) {
  if (!issueId) return 'Saved.';

  return `Saved with ${assignmentCount} assignment(s). Download to see changes.`;
}
