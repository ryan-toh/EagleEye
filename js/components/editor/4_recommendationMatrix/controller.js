import { getSelectedIssue } from '../2_issue/controller.js';
import {
  closeDialog,
  renderSelectedIssuePreview,
  setEditorStatus,
} from '../shared/controller.js';
import {
  appState,
  removeRecommendation,
  removeRule,
} from '../../../appState.js';
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
} from './service.js';

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
}

export function refreshRecommendations(issueId) {
  renderRecommendationOptions(issueId);
  setRecommendationSelectedState('');
}

function onCreateRecommendation() {
  renderRecommendationFormFor('__new__', getSelectedIssue());
  recomEditorDom.recommDialog.showModal();
}

function onRecommendationClick(event) {
  const recommendationId = getClickedRecommendationId(event);
  if (!recommendationId) return;

  if (event.target.closest('.decision-explorer__delete')) {
    appState.rules
      .filter((rule) => rule.recommendation_id === recommendationId)
      .map((rule) => rule.rule_id)
      .forEach(removeRule);
    removeRecommendation(recommendationId);
    const issueId = getSelectedIssue();
    renderRecommendationOptions(issueId);
    setRecommendationSelectedState('');
    void renderSelectedIssuePreview();
    setEditorStatus(
      'Recommendation deleted. Download to save changes.',
      'success',
    );
    return;
  }

  recomEditorDom.recommSelect.value = recommendationId;
  setRecommendationSelectedState(recommendationId);
}

function onRecommendationDoubleClick(event) {
  if (event.target.closest('.decision-explorer__delete')) return;

  const recommendationId = getClickedRecommendationId(event);
  if (!recommendationId) return;
  recomEditorDom.recommSelect.value = recommendationId;
  setRecommendationSelectedState(recommendationId);
  renderRecommendationFormFor(recommendationId, getSelectedIssue());
  recomEditorDom.recommDialog.showModal();
}

async function onSaveRecommendation() {
  try {
    const recommendation = saveRecommendation({
      recommendationId: recomEditorDom.recommendationId.value,
      finalDecision: recomEditorDom.recommendationDecision.value,
      recommendationText: recomEditorDom.recommendationText.value,
      nextSteps: recomEditorDom.recommendationNextSteps.value,
      escalationNote: recomEditorDom.recommendationEscalationNote.value,
    });
    const issueId = getSelectedIssue();
    const assignmentCount = issueId
      ? saveRecommendationAssignments(
          issueId,
          recommendation.recommendation_id,
          collectRecommendationAssignments(),
        )
      : 0;

    renderRecommendationOptions(issueId);
    recomEditorDom.recommSelect.value = '';
    setRecommendationSelectedState('');
    closeDialog(recomEditorDom.recommDialog);
    await renderSelectedIssuePreview();
    setEditorStatus(
      `Saved${issueId ? ` with ${assignmentCount} assignment(s). Download to see changes.` : ''}.`,
      'success',
    );
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}
