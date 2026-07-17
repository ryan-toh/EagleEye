import { appState, getIssueParameters, getIssueRules, getRecommendationsForRules } from '../../appState.js';
import { escapeHtml, isRequired, str, toList } from '../../utils.js';

export const previewDom = {}

export function initPreviewDomElements() {
    Object.assign(previewDom, {
        parametersList:      document.getElementById('parametersList'),
        rulesList:           document.getElementById('rulesList'),
        recommendationsList: document.getElementById('recommendationsList'),
        flowchart:           document.getElementById('flowchart'),
        copyMermaidBtn:      document.getElementById('copyMermaidBtn'),
    })
}

export function renderIssueSummary(issueId) {
  const issueParameters = getIssueParameters(issueId);
  const issueRules = getIssueRules(issueId);
  const issueRecommendations = getRecommendationsForRules(issueRules);
  const parameterNameById = new Map(
    issueParameters.map(param => [str(param.parameter_id), param.parameter_name])
  );

  previewDom.parametersList.classList.remove('empty');
  previewDom.parametersList.innerHTML = toList(issueParameters, param => {
    const required = isRequired(param.required);
    return `
      <strong>${escapeHtml(param.parameter_name)}</strong>
      <span class="badge ${required ? 'required' : 'optional'}">${required ? 'required' : 'optional'}</span><br />
      ${escapeHtml(param.question_to_ask)}
      ${param.allowed_values ? `<br /><small>Allowed: ${escapeHtml(param.allowed_values)}</small>` : ''}
    `;
  });

  previewDom.rulesList.classList.remove('empty');
  previewDom.rulesList.innerHTML = toList(issueRules, rule => `
    <strong>Priority ${escapeHtml(rule.priority)}</strong><br />
    ${renderRuleConditions(rule.conditions, parameterNameById)}
    <small>Recommendation id: ${escapeHtml(rule.recommendation_id)}</small>
  `);

  previewDom.recommendationsList.classList.remove('empty');
  previewDom.recommendationsList.innerHTML = toList(issueRecommendations, rec => `
    <strong>${escapeHtml(rec.final_decision)}</strong><br />
    <small>Recommendation id: ${escapeHtml(rec.recommendation_id)}</small><br />
    ${escapeHtml(rec.recommendation_text)}
    ${rec.next_steps ? `<br /><small>Next steps: ${escapeHtml(rec.next_steps)}</small>` : ''}
    ${rec.escalation_note ? `<br /><small>Escalation: ${escapeHtml(rec.escalation_note)}</small>` : ''}
  `);
}

export function renderEmptyIssueView() {
  previewDom.parametersList.className = 'empty';
  previewDom.parametersList.textContent = 'No issue selected.';

  previewDom.rulesList.className = 'empty';
  previewDom.rulesList.textContent = 'No issue selected.';

  previewDom.recommendationsList.className = 'empty';
  previewDom.recommendationsList.textContent = 'No issue selected.';

  previewDom.flowchart.className = 'flowchart empty';
  previewDom.flowchart.textContent = 'Load files and select an issue.';

  previewDom.copyMermaidBtn.disabled = true;
  appState.lastMermaid = '';
}

function renderRuleConditions(conditions, parameterNameById) {
  const parsedConditions = parseRuleConditions(conditions);

  if (!parsedConditions) {
    return `<span class="rule-conditions__raw">${escapeHtml(conditions)}</span><br />`;
  }

  const items = Object.entries(parsedConditions).map(([parameterId, value]) => {
    const parameterName = parameterNameById.get(str(parameterId)) || parameterId;
    return `
      <li class="rule-conditions__item">
        <span class="rule-conditions__name">${escapeHtml(parameterName)}</span>
        <span class="rule-conditions__value">${escapeHtml(value)}</span>
      </li>
    `;
  }).join('');

  return `<ul class="rule-conditions">${items}</ul>`;
}

function parseRuleConditions(conditions) {
  try {
    const parsed = JSON.parse(str(conditions));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
