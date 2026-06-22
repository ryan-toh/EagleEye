import { appState, getIssuesForTopic, getIssueParameters, getIssueRules, getRecommendationsForRules } from './state.js';
import { escapeHtml, isRequired, str, toList } from './utils.js';

export const dom = {
  loadBtn: document.getElementById('loadBtn'),
  loadStatus: document.getElementById('loadStatus'),
  topicSelect: document.getElementById('topicSelect'),
  issueSelect: document.getElementById('issueSelect'),
  parametersList: document.getElementById('parametersList'),
  rulesList: document.getElementById('rulesList'),
  recommendationsList: document.getElementById('recommendationsList'),
  flowchart: document.getElementById('flowchart'),
  copyMermaidBtn: document.getElementById('copyMermaidBtn')
};

export function setStatus(message, type = '') {
  dom.loadStatus.textContent = message;
  dom.loadStatus.className = `status ${type}`.trim();
}

export function disableLoading(message) {
  setStatus(message, 'error');
  dom.loadBtn.disabled = true;
}

export function renderTopicOptions() {
  dom.topicSelect.innerHTML = '<option value="">Select a topic</option>';

  appState.topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = str(topic.topic_id);
    option.textContent = `${topic.topic_name} (${topic.topic_id})`;
    dom.topicSelect.appendChild(option);
  });

  dom.topicSelect.disabled = false;
  renderIssueOptions('');
  clearIssueView();
}

export function renderIssueOptions(topicId) {
  const issues = topicId ? getIssuesForTopic(topicId) : [];

  dom.issueSelect.innerHTML = topicId
    ? '<option value="">Select an issue</option>'
    : '<option value="">Select a topic first</option>';

  issues.forEach(issue => {
    const option = document.createElement('option');
    option.value = str(issue.issue_id);
    option.textContent = `${issue.issue_name} (${issue.issue_id})`;
    dom.issueSelect.appendChild(option);
  });

  dom.issueSelect.disabled = !topicId;
}

export function renderIssueSummary(issueId) {
  const issueParameters = getIssueParameters(issueId);
  const issueRules = getIssueRules(issueId);
  const issueRecommendations = getRecommendationsForRules(issueRules);

  dom.parametersList.classList.remove('empty');
  dom.parametersList.innerHTML = toList(issueParameters, param => {
    const required = isRequired(param.required);
    return `
      <strong>${escapeHtml(param.parameter_id)}</strong>
      <span class="badge ${required ? 'required' : 'optional'}">${required ? 'required' : 'optional'}</span><br />
      ${escapeHtml(param.question_to_ask)}
      ${param.allowed_values ? `<br /><small>Allowed: ${escapeHtml(param.allowed_values)}</small>` : ''}
    `;
  });

  dom.rulesList.classList.remove('empty');
  dom.rulesList.innerHTML = toList(issueRules, rule => `
    <strong>Priority ${escapeHtml(rule.priority)}</strong><br />
    ${escapeHtml(rule.conditions)}<br />
    <small>Recommendation: ${escapeHtml(rule.recommendation_id)}</small>
  `);

  dom.recommendationsList.classList.remove('empty');
  dom.recommendationsList.innerHTML = toList(issueRecommendations, rec => `
    <strong>${escapeHtml(rec.final_decision)}</strong><br />
    ${escapeHtml(rec.recommendation_text)}
    ${rec.next_steps ? `<br /><small>Next steps: ${escapeHtml(rec.next_steps)}</small>` : ''}
    ${rec.escalation_note ? `<br /><small>Escalation: ${escapeHtml(rec.escalation_note)}</small>` : ''}
  `);
}

export function clearIssueView() {
  dom.parametersList.className = 'empty';
  dom.parametersList.textContent = 'No issue selected.';

  dom.rulesList.className = 'empty';
  dom.rulesList.textContent = 'No issue selected.';

  dom.recommendationsList.className = 'empty';
  dom.recommendationsList.textContent = 'No issue selected.';

  dom.flowchart.className = 'flowchart empty';
  dom.flowchart.textContent = 'Load files and select an issue.';

  dom.copyMermaidBtn.disabled = true;
  appState.lastMermaid = '';
}

export async function copyMermaid() {
  if (!appState.lastMermaid) return;

  await navigator.clipboard.writeText(appState.lastMermaid);
  dom.copyMermaidBtn.textContent = 'Copied';
  setTimeout(() => (dom.copyMermaidBtn.textContent = 'Copy Mermaid'), 1200);
}