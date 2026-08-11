import {
  appState,
  getIssueParameters,
  makeUniqueId,
} from '../../../appState.js';
import { escapeHtml, str } from '../../../utils.js';
import { createExplorerItem } from '../shared/dom.js';
import {
  getRecommendationAssignments,
  getRecommendations,
  getRecommendationsForIssue,
  getParametersWithAllowedValues,
  parseAllowedValues,
  parseConditions,
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
    addRecommendationAssignmentBtn: document.getElementById(
      'addRecommendationAssignmentBtn',
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
        ? `${assignmentCount} assignment${assignmentCount === 1 ? '' : 's'} · ${recommendation.recommendation_text || 'No response text'}`
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

export function renderRecommendationFormFor(recommendationId, issueId) {
  const recommendation = getRecommendations().find(
    (item) => str(item.recommendation_id) === str(recommendationId),
  );
  recomEditorDom.recommendationId.value =
    recommendation?.recommendation_id ||
    makeUniqueId('REC', appState.recommendations, 'recommendation_id');
  recomEditorDom.recommendationDecision.value =
    recommendation?.final_decision || 'Answered';
  recomEditorDom.recommendationText.value =
    recommendation?.recommendation_text || '';
  recomEditorDom.recommendationNextSteps.value =
    recommendation?.next_steps || '';
  recomEditorDom.recommendationEscalationNote.value =
    recommendation?.escalation_note || '';
  renderAssignmentChoices(issueId, recommendation?.recommendation_id);
}

export function collectRecommendationAssignments() {
  const assignments = [
    ...recomEditorDom.recommendationAssignments.querySelectorAll(
      '[data-recommendation-assignment]',
    ),
  ];
  return assignments.map((assignment) => {
    const conditions = {};
    assignment
      .querySelectorAll('.recommendation-assignment__condition')
      .forEach((condition) => {
        const parameterId = condition.querySelector(
          '.recommendation-assignment__parameter',
        ).value;
        const value = condition.querySelector(
          '.recommendation-assignment__value',
        ).value;
        if (!parameterId || !value) {
          throw new Error(
            'Choose a parameter and response for every condition.',
          );
        }
        if (Object.hasOwn(conditions, parameterId)) {
          throw new Error(
            'Each parameter can only be used once in an assignment.',
          );
        }
        conditions[parameterId] = value;
      });

    return {
      conditions,
      priority: assignment.querySelector('.recommendation-assignment__priority')
        .value,
    };
  });
}

export function addRecommendationAssignment() {
  if (!assignmentParameters.length) return;
  recomEditorDom.recommendationAssignments.insertAdjacentHTML(
    'beforeend',
    renderAssignmentCard(),
  );
}

export function handleRecommendationAssignmentClick(event) {
  const assignment = event.target.closest('[data-recommendation-assignment]');
  if (!assignment) return;

  if (event.target.closest('[data-remove-assignment]')) {
    assignment.remove();
    return;
  }

  if (event.target.closest('[data-add-condition]')) {
    assignment
      .querySelector('.recommendation-assignment__conditions')
      .insertAdjacentHTML('beforeend', renderCondition());
    if (assignment.dataset.autoPriority === 'true') {
      assignment.querySelector('.recommendation-assignment__priority').value =
        1;
    }
    return;
  }

  if (event.target.closest('[data-remove-condition]')) {
    const conditions = assignment.querySelectorAll(
      '.recommendation-assignment__condition',
    );
    if (conditions.length === 1) {
      assignment.remove();
    } else {
      event.target.closest('.recommendation-assignment__condition').remove();
    }
  }
}

export function handleRecommendationAssignmentChange(event) {
  if (event.target.matches('.recommendation-assignment__priority')) {
    event.target.closest(
      '[data-recommendation-assignment]',
    ).dataset.autoPriority = 'false';
    return;
  }

  const parameterSelect = event.target.closest(
    '.recommendation-assignment__parameter',
  );
  if (!parameterSelect) return;

  const valueSelect = parameterSelect
    .closest('.recommendation-assignment__condition')
    .querySelector('.recommendation-assignment__value');
  valueSelect.innerHTML = renderValueOptions(parameterSelect.value);
}

let assignmentParameters = [];

function renderAssignmentChoices(issueId, recommendationId) {
  if (!issueId) {
    recomEditorDom.recommendationAssignments.innerHTML =
      '<p class="helper-text">Save the recommendation now; select an issue before adding assignments.</p>';
    recomEditorDom.addRecommendationAssignmentBtn.disabled = true;
    return;
  }

  assignmentParameters = getParametersWithAllowedValues(issueId);
  recomEditorDom.addRecommendationAssignmentBtn.disabled =
    !assignmentParameters.length;
  if (!assignmentParameters.length) {
    const assignments = recommendationId
      ? getRecommendationAssignments(issueId, recommendationId)
      : [];
    const hasParameters = getIssueParameters(issueId).length > 0;
    recomEditorDom.recommendationAssignments.innerHTML = assignments.length
      ? assignments
          .map((rule) => renderDirectAssignmentCard(rule.priority))
          .join('')
      : hasParameters
        ? '<p class="helper-text">Add allowed values to parameters before adding an assignment.</p>'
        : renderDirectAssignmentCard();
    return;
  }
  const assignments = recommendationId
    ? getRecommendationAssignments(issueId, recommendationId)
    : [];
  recomEditorDom.recommendationAssignments.innerHTML = assignments.length
    ? assignments
        .map((rule) =>
          (() => {
            const conditions = parseConditions(rule.conditions) || {};
            return Object.keys(conditions).length
              ? renderAssignmentCard(conditions, rule.priority)
              : renderDirectAssignmentCard(rule.priority);
          })(),
        )
        .join('')
    : '<p class="helper-text">No assignments yet. Add one to define when this recommendation should be used.</p>';
}

function renderAssignmentCard(conditions = {}, priority) {
  const entries = Object.entries(conditions);
  const conditionRows = (entries.length ? entries : [['', '']])
    .map(([parameterId, value]) => renderCondition(parameterId, value))
    .join('');
  const defaultPriority = 1;

  return `
    <section class="recommendation-assignment" data-recommendation-assignment data-auto-priority="${priority ? 'false' : 'true'}">
      <div class="recommendation-assignment__header">
        <strong>Use this recommendation when</strong>
        <button class="recommendation-assignment__remove" type="button" data-remove-assignment>Remove</button>
      </div>
      <div class="recommendation-assignment__conditions">${conditionRows}</div>
      <div class="recommendation-assignment__footer">
        <button type="button" data-add-condition>Add another condition</button>
        <span class="helper-text">Other parameters are not needed.</span>
        <details>
          <summary>Advanced</summary>
          <label>Rule priority <input class="recommendation-assignment__priority" type="number" min="1" value="${escapeHtml(priority || defaultPriority)}" /></label>
        </details>
      </div>
    </section>`;
}

function renderDirectAssignmentCard(priority) {
  return `
    <section class="recommendation-assignment" data-recommendation-assignment>
      <div class="recommendation-assignment__header">
        <strong>Use this recommendation directly</strong>
        <button class="recommendation-assignment__remove" type="button" data-remove-assignment>Remove</button>
      </div>
      <p class="helper-text">This issue has no parameters, so the recommendation is applied directly.</p>
      <details>
        <summary>Advanced</summary>
        <label>Rule priority <input class="recommendation-assignment__priority" type="number" min="1" value="${escapeHtml(priority || 1)}" /></label>
      </details>
    </section>`;
}

function renderCondition(selectedParameterId = '', selectedValue = '') {
  return `
    <div class="recommendation-assignment__condition">
      <span class="recommendation-assignment__condition-label">Parameter</span>
      <select class="recommendation-assignment__parameter">
        <option value="">Choose a question</option>
        ${assignmentParameters
          .map(
            (param) =>
              `<option value="${escapeHtml(param.parameter_id)}" ${str(param.parameter_id) === str(selectedParameterId) ? 'selected' : ''}>${escapeHtml(param.question_to_ask || param.parameter_name)}</option>`,
          )
          .join('')}
      </select>
      <span class="recommendation-assignment__condition-label">Response</span>
      <select class="recommendation-assignment__value">${renderValueOptions(selectedParameterId, selectedValue)}</select>
      <button class="recommendation-assignment__remove-condition" type="button" data-remove-condition aria-label="Remove condition">×</button>
    </div>`;
}

function renderValueOptions(parameterId, selectedValue = '') {
  const parameter = assignmentParameters.find(
    (item) => str(item.parameter_id) === str(parameterId),
  );
  const values = parameter ? parseAllowedValues(parameter.allowed_values) : [];
  return `<option value="">Choose a response</option>${values
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}" ${str(value) === str(selectedValue) ? 'selected' : ''}>${escapeHtml(value)}</option>`,
    )
    .join('')}`;
}

function setSelectedState(container, datasetKey, selectedId) {
  container.querySelectorAll('.decision-explorer__item').forEach((item) => {
    item.classList.toggle(
      'is-selected',
      item.dataset[datasetKey] === String(selectedId),
    );
  });
}
