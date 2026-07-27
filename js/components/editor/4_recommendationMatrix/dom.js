import {
  appState,
  makeUniqueId,
} from '../../../appState.js';
import { escapeHtml, str } from '../../../utils.js';
import { createExplorerItem } from '../shared/dom.js';
import {
  buildParameterCombinations,
  getRecommendationAssignments,
  getRecommendations,
  getRecommendationsForIssue,
  getRuleForCombination,
  getParametersWithAllowedValues,
} from './service.js';

export const recomEditorDom = {};

export function initRecomEditorDom() {
  Object.assign(recomEditorDom, {
    createRecommendationBtn: document.getElementById('createRecommendationBtn'),
    recommSearch: document.getElementById('editorRecommendationSearch'),
    recommSelect: document.getElementById('editorRecommendationSelect'),
    recommList: document.getElementById('editorRecommendationList'),
    recommPanelHint: document.getElementById('editorRecommendationPanelHint'),
    recommDialog: document.getElementById('editorRecommendationDialog'),
    recommendationPicker: document.getElementById('editorRecommendationPicker'),
    recommendationId: document.getElementById('editorRecommendationId'),
    recommendationDecision: document.getElementById(
      'editorRecommendationDecision',
    ),
    recommendationText: document.getElementById('editorRecommendationText'),
    recommendationNextSteps: document.getElementById(
      'editorRecommendationNextSteps',
    ),
    recommendationEscalationNote: document.getElementById(
      'editorRecommendationEscalationNote',
    ),
    recommendationAssignments: document.getElementById(
      'editorRecommendationAssignments',
    ),
    saveRecommendationBtn: document.getElementById('saveRecommendationBtn'),
  });
}

export function setRecommendationSelectedState(recommendationId) {
  setSelectedState(
    recomEditorDom.recommList,
    'recommendationId',
    recommendationId,
  );
}

export function renderRecommendationOptions(issueId) {
  recomEditorDom.recommList.innerHTML = '';
  recomEditorDom.recommPanelHint.textContent = issueId
    ? 'Create or double click on recommendation to edit'
    : 'Select an issue first';

  if (!issueId) {
    recomEditorDom.recommSearch.disabled = true;
    recomEditorDom.recommList.innerHTML =
      '<div class="decision-explorer__empty">Select an issue first</div>';
    return;
  }

  recomEditorDom.recommSearch.disabled = false;
  const recommendations = getRecommendationsForIssue(issueId);
  const query = recomEditorDom.recommSearch.value.trim().toLowerCase();
  const matchingRecommendations = recommendations.filter((recommendation) =>
    str(recommendation.final_decision).toLowerCase().includes(query),
  );

  if (!matchingRecommendations.length) {
    recomEditorDom.recommList.innerHTML = `<div class="decision-explorer__empty">${recommendations.length ? 'No recommendations match your search' : 'No recommendations assigned to this issue yet'}</div>`;
    return;
  }

  matchingRecommendations.forEach((recommendation) => {
    const assignmentCount = issueId
      ? getRecommendationAssignments(issueId, recommendation.recommendation_id)
          .length
      : 0;
    const item = createExplorerItem({
      id: recommendation.recommendation_id,
      title: recommendation.final_decision || 'Clarify',
      meta: issueId
        ? `${assignmentCount} assigned combination${assignmentCount === 1 ? '' : 's'} · ${recommendation.recommendation_text || 'No response text'}`
        : recommendation.recommendation_text || 'No response text',
      type: 'recommendation',
      icon: '✦',
    });
    recomEditorDom.recommList.appendChild(item);
  });

  setRecommendationSelectedState(recomEditorDom.recommSelect.value);
}

export function getClickedRecommendationId(event) {
  const item = event.target.closest('[data-recommendation-id]');
  return item ? item.dataset.recommendationId : '';
}

export function renderRecommendationPicker() {
  recomEditorDom.recommendationPicker.innerHTML =
    '<option value="__new__">+ Create new recommendation</option>';
  getRecommendations().forEach((recommendation) => {
    const option = document.createElement('option');
    option.value = recommendation.recommendation_id;
    option.textContent = `${recommendation.final_decision || 'Clarify'}: ${recommendation.recommendation_id}`;
    recomEditorDom.recommendationPicker.appendChild(option);
  });
}

export function renderRecommendationFormFor(recommendationId, issueId) {
  const recommendation = getRecommendations().find(
    (item) => str(item.recommendation_id) === str(recommendationId),
  );
  recomEditorDom.recommendationId.value =
    recommendation?.recommendation_id ||
    makeUniqueId('REC', appState.recommendations, 'recommendation_id');
  recomEditorDom.recommendationDecision.value =
    recommendation?.final_decision || 'Clarify';
  recomEditorDom.recommendationText.value =
    recommendation?.recommendation_text || '';
  recomEditorDom.recommendationNextSteps.value =
    recommendation?.next_steps || '';
  recomEditorDom.recommendationEscalationNote.value =
    recommendation?.escalation_note || '';
  recomEditorDom.recommendationPicker.value = recommendation
    ? recommendation.recommendation_id
    : '__new__';
  renderAssignmentChoices(issueId, recommendation?.recommendation_id);
}

export function collectRecommendationAssignments() {
  const rows = [
    ...recomEditorDom.recommendationAssignments.querySelectorAll(
      '[data-combination]',
    ),
  ];
  if (!rows.length) return null;

  return rows.map((row) => ({
    conditions: JSON.parse(row.dataset.combination),
    selected: row.querySelector('.recommendation-assignment__checkbox').checked,
    priority: row.querySelector('.recommendation-assignment__priority').value,
  }));
}

function renderAssignmentChoices(issueId, recommendationId) {
  if (!issueId) {
    recomEditorDom.recommendationAssignments.innerHTML =
      '<p class="helper-text">Save the recommendation now; select an issue before assigning combinations.</p>';
    return;
  }

  const parameters = getParametersWithAllowedValues(issueId);
  const combinations = buildParameterCombinations(issueId);
  if (!parameters.length) {
    recomEditorDom.recommendationAssignments.innerHTML =
      '<p class="helper-text">Add allowed values to parameters before assigning combinations.</p>';
    return;
  }
  if (combinations.length > 200) {
    recomEditorDom.recommendationAssignments.innerHTML = `<p class="status error">This issue has ${combinations.length} combinations. Reduce allowed values before assigning them.</p>`;
    return;
  }

  recomEditorDom.recommendationAssignments.innerHTML = combinations
    .map((combination, index) => {
      const rule = getRuleForCombination(issueId, combination);
      const selected =
        rule && str(rule.recommendation_id) === str(recommendationId);
      const summary = parameters
        .map(
          (param) =>
            `${param.parameter_name}: ${combination[param.parameter_id]}`,
        )
        .join(' · ');
      return `
      <label class="recommendation-assignment" data-combination='${escapeHtml(JSON.stringify(combination))}'>
        <input class="recommendation-assignment__checkbox" type="checkbox" ${selected ? 'checked' : ''} />
        <span class="recommendation-assignment__summary">${escapeHtml(summary)}</span>
        <span class="recommendation-assignment__priority-wrap">Priority <input class="recommendation-assignment__priority" type="number" min="1" value="${escapeHtml(rule?.priority || index + 1)}" /></span>
      </label>`;
    })
    .join('');
}

function setSelectedState(container, datasetKey, selectedId) {
  container.querySelectorAll('.decision-explorer__item').forEach((item) => {
    item.classList.toggle(
      'is-selected',
      item.dataset[datasetKey] === String(selectedId),
    );
  });
}
