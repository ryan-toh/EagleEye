import { appState, getIssue, getIssueParameters, getIssuesForTopic, getTopic, makeUniqueId } from '../../state.js';
import { escapeHtml, str } from '../../utils.js';
import {
  buildParameterCombinations,
  getParametersWithAllowedValues,
  getRecommendationForCombination,
  getRuleForCombination
} from './service.js';

export const editorDom = {};

export function initEditorDom() {
  Object.assign(editorDom, {
    topicPicker: document.getElementById('editorTopicPicker'),
    topicId: document.getElementById('editorTopicId'),
    topicName: document.getElementById('editorTopicName'),
    topicDescription: document.getElementById('editorTopicDescription'),
    topicExamples: document.getElementById('editorTopicExamples'),
    saveTopicBtn: document.getElementById('saveTopicBtn'),

    issuePicker: document.getElementById('editorIssuePicker'),
    issueId: document.getElementById('editorIssueId'),
    issueName: document.getElementById('editorIssueName'),
    issueDescription: document.getElementById('editorIssueDescription'),
    issueExamples: document.getElementById('editorIssueExamples'),
    saveIssueBtn: document.getElementById('saveIssueBtn'),

    parameterPicker: document.getElementById('editorParameterPicker'),
    parameterId: document.getElementById('editorParameterId'),
    parameterName: document.getElementById('editorParameterName'),
    parameterQuestion: document.getElementById('editorParameterQuestion'),
    parameterRequired: document.getElementById('editorParameterRequired'),
    parameterAllowedValues: document.getElementById('editorParameterAllowedValues'),
    parameterExampleValues: document.getElementById('editorParameterExampleValues'),
    parameterOrder: document.getElementById('editorParameterOrder'),
    saveParameterBtn: document.getElementById('saveParameterBtn'),

    buildCombinationsBtn: document.getElementById('buildCombinationsBtn'),
    saveCombinationRulesBtn: document.getElementById('saveCombinationRulesBtn'),
    recommendationMatrix: document.getElementById('recommendationMatrix'),
    editorStatus: document.getElementById('editorStatus'),

    saveSheetBtn: document.getElementById('saveSheetBtn'),
  });

  return editorDom;
}

export function setEditorStatus(message, type = '') {
  editorDom.editorStatus.textContent = message;
  editorDom.editorStatus.className = `status ${type}`.trim();
}

export function refreshEditorPickers() {
  renderTopicPicker();
  renderIssuePicker(appState.selectedTopicId);
  renderParameterPicker(appState.selectedIssueId);
}

export function renderTopicPicker() {
  editorDom.topicPicker.innerHTML = '<option value="__new__">+ Create new topic</option>';

  appState.topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = str(topic.topic_id);
    // option.textContent = `${topic.topic_name} (${topic.topic_id})`;
    option.textContent = `${topic.topic_name}`;
    editorDom.topicPicker.appendChild(option);
  });

  editorDom.topicPicker.value = appState.selectedTopicId || '__new__';
  fillTopicForm(editorDom.topicPicker.value);
}

export function renderIssuePicker(topicId) {
  editorDom.issuePicker.innerHTML = '<option value="__new__">+ Create new issue</option>';

  if (topicId) {
    getIssuesForTopic(topicId).forEach(issue => {
      const option = document.createElement('option');
      option.value = str(issue.issue_id);
      // option.textContent = `${issue.issue_name} (${issue.issue_id})`;
      option.textContent = `${issue.issue_name}`;
      editorDom.issuePicker.appendChild(option);
    });
  }

  editorDom.issuePicker.disabled = !topicId;
  editorDom.issuePicker.value = appState.selectedIssueId || '__new__';
  fillIssueForm(editorDom.issuePicker.value);
}

export function renderParameterPicker(issueId) {
  editorDom.parameterPicker.innerHTML = '<option value="__new__">+ Create new parameter</option>';

  if (issueId) {
    getIssueParameters(issueId).forEach(parameter => {
      const option = document.createElement('option');
      option.value = str(parameter.parameter_id);
      // option.textContent = `${parameter.parameter_id} (${parameter.required || 'required'})`;
      // option.textContent = `${parameter.parameter_id}`;
      option.textContent = `${parameter.parameter_name}`;
      editorDom.parameterPicker.appendChild(option);
    });
  }

  const disabled = !issueId;
  editorDom.parameterPicker.disabled = disabled;
  editorDom.saveParameterBtn.disabled = disabled;
  editorDom.buildCombinationsBtn.disabled = disabled;
  editorDom.saveCombinationRulesBtn.disabled = disabled;

  editorDom.parameterPicker.value = '__new__';
  fillParameterForm('__new__');
  clearRecommendationMatrix();
}

export function fillTopicForm(topicId) {
  const topic = topicId === '__new__' ? null : getTopic(topicId);

  editorDom.topicId.value = topic?.topic_id || makeUniqueId('TOPIC', appState.topics, 'topic_id');
  console.log(editorDom.topicId.value);
  // editorDom.topicId.value = makeUniqueId('TOPIC', appState.topics, 'topic_id');
  editorDom.topicName.value = topic?.topic_name || '';
  editorDom.topicDescription.value = topic?.description || '';
  editorDom.topicExamples.value = topic?.example_phrases || '';
}

export function fillIssueForm(issueId) {
  const issue = issueId === '__new__' ? null : getIssue(issueId);

  editorDom.issueId.value = issue?.issue_id || makeUniqueId('ISSUE', appState.issues, 'issue_id');
  // editorDom.issueId.value = makeUniqueId('ISSUE', appState.issues, 'issue_id');
  editorDom.issueName.value = issue?.issue_name || '';
  editorDom.issueDescription.value = issue?.issue_description || '';
  editorDom.issueExamples.value = issue?.example_phrases || '';
}

export function fillParameterForm(parameterId) {
  const parameter = getIssueParameters(appState.selectedIssueId)
    .find(item => str(item.parameter_id) === str(parameterId));

  editorDom.parameterId.value = parameter?.parameter_id || makeUniqueId('PARAM', appState.parameters, 'parameter_id');
  // editorDom.parameterId.value = makeUniqueId('PARAM', appState.parameters, 'parameter_id');
  editorDom.parameterName.value = parameter?.parameter_name || '';
  editorDom.parameterQuestion.value = parameter?.question_to_ask || '';
  editorDom.parameterRequired.value = parameter?.required || 'yes';
  editorDom.parameterAllowedValues.value = parameter?.allowed_values || '';
  editorDom.parameterExampleValues.value = parameter?.example_values || '';
  editorDom.parameterOrder.value = parameter?.order || getIssueParameters(appState.selectedIssueId).length + 1;
}

export function renderRecommendationMatrix(issueId) {
  const parameters = getParametersWithAllowedValues(issueId);
  const combinations = buildParameterCombinations(issueId);

  if (!parameters.length) {
    editorDom.recommendationMatrix.innerHTML = '<p class="empty">Add allowed_values to at least one parameter before building recommendation combinations.</p>';
    editorDom.saveCombinationRulesBtn.disabled = true;
    return;
  }

  if (combinations.length > 200) {
    editorDom.recommendationMatrix.innerHTML = `<p class="status error">This would create ${combinations.length} combinations. Reduce allowed_values before generating the matrix.</p>`;
    editorDom.saveCombinationRulesBtn.disabled = true;
    return;
  }

  const headerCells = parameters.map(param => `<th>${escapeHtml(param.parameter_name)}</th>`).join('');
  const rows = combinations.map((combination, index) => {
    const rule = getRuleForCombination(issueId, combination);
    const rec = getRecommendationForCombination(issueId, combination);
    const conditionCells = parameters.map(param => `<td>${escapeHtml(combination[param.parameter_id])}</td>`).join('');

    return `
      <tr data-combination='${escapeHtml(JSON.stringify(combination))}'>
        ${conditionCells}
        <td><input class="combo-priority" type="number" min="1" value="${escapeHtml(rule?.priority || index + 1)}" /></td>
        <td>
          <select class="combo-decision">
            ${decisionOption('Yes', rec?.final_decision)}
            ${decisionOption('No', rec?.final_decision)}
            ${decisionOption('Escalate', rec?.final_decision)}
            ${decisionOption('Clarify', rec?.final_decision)}
          </select>
        </td>
        <td><textarea class="combo-text" rows="2">${escapeHtml(rec?.recommendation_text || '')}</textarea></td>
        <td><textarea class="combo-next" rows="2">${escapeHtml(rec?.next_steps || '')}</textarea></td>
        <td><textarea class="combo-escalation" rows="2">${escapeHtml(rec?.escalation_note || '')}</textarea></td>
      </tr>
    `;
  }).join('');

  editorDom.recommendationMatrix.innerHTML = `
    <div class="table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            ${headerCells}
            <th>Priority</th>
            <th>Decision</th>
            <th>Final response</th>
            <th>Next steps</th>
            <th>Escalation note</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  editorDom.saveCombinationRulesBtn.disabled = false;
}

export function collectCombinationRows() {
  return [...editorDom.recommendationMatrix.querySelectorAll('tbody tr')].map(row => ({
    conditions: JSON.parse(row.dataset.combination),
    priority: row.querySelector('.combo-priority').value,
    final_decision: row.querySelector('.combo-decision').value,
    recommendation_text: row.querySelector('.combo-text').value,
    next_steps: row.querySelector('.combo-next').value,
    escalation_note: row.querySelector('.combo-escalation').value
  }));
}

function clearRecommendationMatrix() {
  editorDom.recommendationMatrix.innerHTML = '<p class="empty">Select an issue, add parameters with allowed_values, then build combinations.</p>';
}

function decisionOption(value, selectedValue) {
  return `<option value="${value}" ${str(selectedValue || 'Clarify') === value ? 'selected' : ''}>${value}</option>`;
}