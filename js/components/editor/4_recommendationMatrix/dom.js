import {
  appState,
  getIssueParameters,
  makeUniqueId,
} from '../../../appState.js';
import { escapeHtml, str } from '../../../utils.js';
import {
  getClickedExplorerId,
  renderExplorerEmpty,
  renderExplorerList,
  setExplorerSelectedState,
} from '../shared/explorerList.js';
import {
  getRecommendationAssignments,
  getRecommendations,
  getRecommendationsForIssue,
  getParametersWithAllowedValues,
  parseAllowedValues,
  parseConditions,
} from '../../../services/recommendationService.js';

export const recomEditorDom = {};

export function initRecomEditorDom() {
  Object.assign(recomEditorDom, {
    createRecommendationBtn: document.getElementById('createRecommendationBtn'),
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

/** Controller Functions */

export function setRecommendationSelectedState(recommendationId) {
  setExplorerSelectedState(
    recomEditorDom.recommList,
    'recommendationId',
    recommendationId,
  );
}

export function renderRecommendationOptions(issueId) {
  recomEditorDom.recommPanelHint.textContent = issueId
    ? 'Create or double click on recommendation to edit'
    : 'Select an issue first';

  if (!issueId) {
    renderExplorerEmpty(recomEditorDom.recommList, 'Select an issue first');
    return;
  }

  const recommendations = getRecommendationsForIssue(issueId);
  renderExplorerList({
    container: recomEditorDom.recommList,
    items: recommendations,
    query: '',
    selectedId: recomEditorDom.recommSelect.value,
    datasetKey: 'recommendationId',
    getId: (recommendation) => recommendation.recommendation_id,
    getTitle: (recommendation) => recommendation.final_decision || 'Clarify',
    getMeta: (recommendation) => getRecommendationMeta(issueId, recommendation),
    type: 'recommendation',
    icon: '✦',
    emptyMessage: (allRecommendations) =>
      allRecommendations.length
        ? 'No recommendations match your search'
        : 'No recommendations assigned to this issue yet',
  });
}

export function getClickedRecommendationId(event) {
  return getClickedExplorerId(event, 'recommendationId');
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
  const assignmentElements =
    recomEditorDom.recommendationAssignments.querySelectorAll(
      '[data-recommendation-assignment]',
    );

  return [...assignmentElements].map(readRecommendationAssignment);
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
    renderAssignmentIssueRequiredMessage();
    recomEditorDom.addRecommendationAssignmentBtn.disabled = true;
    return;
  }

  assignmentParameters = getParametersWithAllowedValues(issueId);
  const hasAssignmentParameters = assignmentParameters.length > 0;
  recomEditorDom.addRecommendationAssignmentBtn.disabled =
    !hasAssignmentParameters;

  const assignments = getAssignmentsForRecommendation(
    issueId,
    recommendationId,
  );

  if (!hasAssignmentParameters) {
    renderAssignmentsWithoutAllowedValues(issueId, assignments);
    return;
  }

  renderAssignmentsWithAllowedValues(assignments);
}

function getRecommendationMeta(issueId, recommendation) {
  const assignments = getRecommendationAssignments(
    issueId,
    recommendation.recommendation_id,
  );
  const assignmentCount = assignments.length;
  const assignmentLabel = assignmentCount === 1 ? 'assignment' : 'assignments';
  const responseText = recommendation.recommendation_text || 'No response text';

  return `${assignmentCount} ${assignmentLabel} · ${responseText}`;
}

function readRecommendationAssignment(assignmentElement) {
  const conditionElements = assignmentElement.querySelectorAll(
    '.recommendation-assignment__condition',
  );
  const conditions = [...conditionElements].map(readAssignmentCondition);
  const priorityInput = assignmentElement.querySelector(
    '.recommendation-assignment__priority',
  );

  return { conditions, priority: priorityInput.value };
}

function readAssignmentCondition(conditionElement) {
  const parameterSelect = conditionElement.querySelector(
    '.recommendation-assignment__parameter',
  );
  const valueSelect = conditionElement.querySelector(
    '.recommendation-assignment__value',
  );

  return {
    parameterId: parameterSelect.value,
    value: valueSelect.value,
  };
}

function renderAssignmentIssueRequiredMessage() {
  recomEditorDom.recommendationAssignments.innerHTML =
    '<p class="helper-text">Save the recommendation now; select an issue before adding assignments.</p>';
}

function getAssignmentsForRecommendation(issueId, recommendationId) {
  if (!recommendationId) return [];
  return getRecommendationAssignments(issueId, recommendationId);
}

function renderAssignmentsWithoutAllowedValues(issueId, assignments) {
  if (assignments.length) {
    recomEditorDom.recommendationAssignments.innerHTML =
      renderDirectAssignments(assignments);
    return;
  }

  const hasParameters = getIssueParameters(issueId).length > 0;
  recomEditorDom.recommendationAssignments.innerHTML = hasParameters
    ? renderMissingAllowedValuesMessage()
    : renderDirectAssignmentCard();
}

function renderAssignmentsWithAllowedValues(assignments) {
  if (!assignments.length) {
    recomEditorDom.recommendationAssignments.innerHTML =
      renderNoAssignmentsMessage();
    return;
  }

  recomEditorDom.recommendationAssignments.innerHTML = assignments
    .map(renderAssignmentForRule)
    .join('');
}

function renderDirectAssignments(assignments) {
  return assignments
    .map((assignment) => renderDirectAssignmentCard(assignment.priority))
    .join('');
}

function renderAssignmentForRule(rule) {
  const conditions = parseConditions(rule.conditions) || {};
  const hasConditions = Object.keys(conditions).length > 0;

  return hasConditions
    ? renderAssignmentCard(conditions, rule.priority)
    : renderDirectAssignmentCard(rule.priority);
}

function renderMissingAllowedValuesMessage() {
  return '<p class="helper-text">Add allowed values to parameters before adding an assignment.</p>';
}

function renderNoAssignmentsMessage() {
  return '<p class="helper-text">No assignments yet. Add one to define when this recommendation should be used.</p>';
}

function renderAssignmentCard(conditions = {}, priority) {
  const entries = Object.entries(conditions);
  const conditionRows = (entries.length ? entries : [['', '']])
    .map(([parameterId, value]) => renderCondition(parameterId, value))
    .join('');
  const defaultPriority = 1;
  const autoPriority = priority ? 'false' : 'true';
  const priorityInput = renderPriorityInput(priority || defaultPriority);

  return `
    <section class="recommendation-assignment" data-recommendation-assignment data-auto-priority="${autoPriority}">
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
          ${priorityInput}
        </details>
      </div>
    </section>`;
}

function renderDirectAssignmentCard(priority) {
  const defaultPriority = 1;
  const priorityInput = renderPriorityInput(priority || defaultPriority);

  return `
    <section class="recommendation-assignment" data-recommendation-assignment>
      <div class="recommendation-assignment__header">
        <strong>Use this recommendation directly</strong>
        <button class="recommendation-assignment__remove" type="button" data-remove-assignment>Remove</button>
      </div>
      <p class="helper-text">This issue has no parameters, so the recommendation is applied directly.</p>
      <details>
        <summary>Advanced</summary>
        ${priorityInput}
      </details>
    </section>`;
}

function renderPriorityInput(priority) {
  const escapedPriority = escapeHtml(priority);

  return `
    <label>
      Rule priority
      <input
        class="recommendation-assignment__priority"
        type="number"
        min="1"
        value="${escapedPriority}"
      />
    </label>
  `;
}

function renderCondition(selectedParameterId = '', selectedValue = '') {
  const parameterOptions = renderParameterOptions(selectedParameterId);
  const valueOptions = renderValueOptions(selectedParameterId, selectedValue);

  return `
    <div class="recommendation-assignment__condition">
      <span class="recommendation-assignment__condition-label">Parameter</span>
      <select class="recommendation-assignment__parameter">
        <option value="">Choose a question</option>
        ${parameterOptions}
      </select>
      <span class="recommendation-assignment__condition-label">Response</span>
      <select class="recommendation-assignment__value">${valueOptions}</select>
      <button
        class="recommendation-assignment__remove-condition"
        type="button"
        data-remove-condition
        aria-label="Remove condition"
      >
        ×
      </button>
    </div>`;
}

function renderParameterOptions(selectedParameterId) {
  return assignmentParameters
    .map((parameter) => renderParameterOption(parameter, selectedParameterId))
    .join('');
}

function renderParameterOption(parameter, selectedParameterId) {
  const parameterId = str(parameter.parameter_id);
  const isSelected = parameterId === str(selectedParameterId);
  const selectedAttribute = isSelected ? 'selected' : '';
  const label = parameter.question_to_ask || parameter.parameter_name;

  return `<option value="${escapeHtml(parameterId)}" ${selectedAttribute}>${escapeHtml(label)}</option>`;
}

function renderValueOptions(parameterId, selectedValue = '') {
  const parameter = assignmentParameters.find(
    (item) => str(item.parameter_id) === str(parameterId),
  );
  const values = parameter ? parseAllowedValues(parameter.allowed_values) : [];
  const responseOptions = values
    .map((value) => renderValueOption(value, selectedValue))
    .join('');

  return `<option value="">Choose a response</option>${responseOptions}`;
}

function renderValueOption(value, selectedValue) {
  const isSelected = str(value) === str(selectedValue);
  const selectedAttribute = isSelected ? 'selected' : '';
  const escapedValue = escapeHtml(value);

  return `<option value="${escapedValue}" ${selectedAttribute}>${escapedValue}</option>`;
}
