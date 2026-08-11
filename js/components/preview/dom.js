import {
  appState,
  getIssue,
  getIssueParameters,
  getIssueRules,
  getRecommendationsForRules,
} from '../../appState.js';
import { escapeHtml, isRequired, str } from '../../utils.js';

export const previewDom = {};

export function initPreviewDomElements() {
  Object.assign(previewDom, {
    parametersList: document.getElementById('parametersList'),
    rulesList: document.getElementById('rulesList'),
    recommendationsList: document.getElementById('recommendationsList'),
    issueSummaryName: document.getElementById('issueSummaryName'),
    issueSummaryDescription: document.getElementById('issueSummaryDescription'),
    parameterCount: document.getElementById('parameterCount'),
    ruleCount: document.getElementById('ruleCount'),
    recommendationCount: document.getElementById('recommendationCount'),
    parameterCardCount: document.getElementById('parameterCardCount'),
    ruleCardCount: document.getElementById('ruleCardCount'),
    recommendationCardCount: document.getElementById('recommendationCardCount'),
    flowchartPanel: document.getElementById('flowchartPanel'),
    flowchart: document.getElementById('flowchart'),
    copyMermaidBtn: document.getElementById('copyMermaidBtn'),
    fullscreenFlowchartBtn: document.getElementById('fullscreenFlowchartBtn'),
  });
}

export function renderIssueSummary(issueId) {
  const issue = getIssue(issueId);
  const issueParameters = getIssueParameters(issueId);
  const issueRules = getIssueRules(issueId);
  const issueRecommendations = getRecommendationsForRules(issueRules);
  const parameterById = new Map(
    issueParameters.map((param) => [str(param.parameter_id), param]),
  );

  if (previewDom.issueSummaryName) {
    previewDom.issueSummaryName.textContent =
      issue?.issue_name || 'Untitled issue';
  }
  if (previewDom.issueSummaryDescription) {
    previewDom.issueSummaryDescription.textContent =
      issue?.issue_description || 'No issue description provided.';
  }
  setSummaryCounts(
    issueParameters.length,
    issueRules.length,
    issueRecommendations.length,
  );

  previewDom.parametersList.classList.remove('empty');
  previewDom.parametersList.innerHTML = renderSummaryList(
    issueParameters,
    (param) => {
      const required = isRequired(param.required);
      return `
      <div class="summary-row__heading">
        <strong>${escapeHtml(param.parameter_name)}</strong>
        <span class="badge ${required ? 'required' : 'optional'}">${required ? 'Required' : 'Optional'}</span>
      </div>
      <p class="summary-row__body">${escapeHtml(param.question_to_ask)}</p>
      ${param.allowed_values ? `<p class="summary-row__meta"><span>Allowed values</span>${escapeHtml(param.allowed_values)}</p>` : ''}
    `;
    },
  );

  previewDom.rulesList.classList.remove('empty');
  previewDom.rulesList.innerHTML = renderSummaryList(
    issueRules,
    (rule) => `
    <div class="summary-row__heading">
      <span class="priority-badge">Priority ${escapeHtml(rule.priority)}</span>
      <span class="summary-row__id">${escapeHtml(rule.recommendation_id)}</span>
    </div>
    ${renderRuleConditions(rule.conditions, parameterById)}
  `,
  );

  previewDom.recommendationsList.classList.remove('empty');
  previewDom.recommendationsList.innerHTML = renderSummaryList(
    issueRecommendations,
    (rec) => `
    <div class="summary-row__heading">
      <span class="decision-badge decision-badge--${escapeHtml(rec.final_decision).toLowerCase()}">${escapeHtml(rec.final_decision)}</span>
      <span class="summary-row__id">${escapeHtml(rec.recommendation_id)}</span>
    </div>
    <p class="summary-row__body">${escapeHtml(rec.recommendation_text)}</p>
    ${rec.next_steps ? `<p class="summary-row__meta"><span>Next steps</span>${escapeHtml(rec.next_steps)}</p>` : ''}
    ${rec.escalation_note ? `<p class="summary-row__meta summary-row__meta--alert"><span>Escalation</span>${escapeHtml(rec.escalation_note)}</p>` : ''}
  `,
  );
}

export function renderEmptyIssueView() {
  if (previewDom.issueSummaryName) {
    previewDom.issueSummaryName.textContent = 'No issue selected';
  }
  if (previewDom.issueSummaryDescription) {
    previewDom.issueSummaryDescription.textContent =
      'Select an issue to review its decision setup.';
  }
  setSummaryCounts(0, 0, 0);
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

function setSummaryCounts(parameterCount, ruleCount, recommendationCount) {
  const counts = [
    [
      parameterCount,
      'parameter',
      previewDom.parameterCount,
      previewDom.parameterCardCount,
    ],
    [ruleCount, 'rule', previewDom.ruleCount, previewDom.ruleCardCount],
    [
      recommendationCount,
      'recommendation',
      previewDom.recommendationCount,
      previewDom.recommendationCardCount,
    ],
  ];

  counts.forEach(([count, label, summaryElement, cardElement]) => {
    if (summaryElement) {
      summaryElement.textContent = `${count} ${label}${count === 1 ? '' : 's'}`;
    }
    if (cardElement) {
      cardElement.textContent = count;
    }
  });
}

function renderSummaryList(items, renderer) {
  if (!items.length) return '<p class="empty">None found for this issue.</p>';
  return `<div class="summary-list">${items
    .map((item) => `<article class="summary-row">${renderer(item)}</article>`)
    .join('')}</div>`;
}

function renderRuleConditions(conditions, parameterById) {
  const parsedConditions = parseRuleConditions(conditions);

  if (!parsedConditions) {
    return `<p class="rule-conditions__raw">${escapeHtml(conditions)}</p>`;
  }

  const items = Object.entries(parsedConditions)
    .map(([parameterId, value]) => {
      const parameter = parameterById.get(str(parameterId));
      const question = parameter?.question_to_ask || parameterId;
      return `
      <li class="rule-conditions__item">
        <span class="rule-conditions__label">Parameter:</span>
        <span class="rule-conditions__name">${escapeHtml(question)}</span>
        <span class="rule-conditions__label">Response:</span>
        <span class="rule-conditions__value">${escapeHtml(value)}</span>
      </li>
    `;
    })
    .join('');

  return `<ul class="rule-conditions">${items}</ul>`;
}

function parseRuleConditions(conditions) {
  try {
    const parsed = JSON.parse(str(conditions));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
