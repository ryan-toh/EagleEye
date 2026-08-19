import { clearLastMermaid } from '../../ui/uiState.js';
import { escapeHtml } from '../../utils.js';

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

export function renderIssueSummary(preview) {
  if (previewDom.issueSummaryName) {
    previewDom.issueSummaryName.textContent = preview.name;
  }
  if (previewDom.issueSummaryDescription) {
    previewDom.issueSummaryDescription.textContent = preview.description;
  }
  setSummaryCounts(
    preview.parameters.length,
    preview.rules.length,
    preview.recommendations.length,
  );

  previewDom.parametersList.classList.remove('empty');
  previewDom.parametersList.innerHTML = renderSummaryList(
    preview.parameters,
    renderParameterSummary,
  );

  previewDom.rulesList.classList.remove('empty');
  previewDom.rulesList.innerHTML = renderSummaryList(
    preview.rules,
    (rule) => `
    <div class="summary-row__heading">
      <span class="priority-badge">Priority ${escapeHtml(rule.priority)}</span>
      <span class="summary-row__id">${escapeHtml(rule.recommendationId)}</span>
    </div>
    ${renderRuleConditions(rule.conditions)}
  `,
  );

  previewDom.recommendationsList.classList.remove('empty');
  previewDom.recommendationsList.innerHTML = renderSummaryList(
    preview.recommendations,
    renderRecommendationSummary,
  );
}

function renderParameterSummary(parameter) {
  const requirementClass = parameter.required ? 'required' : 'optional';
  const requirementLabel = parameter.required ? 'Required' : 'Optional';
  const allowedValues = parameter.allowedValues
    ? renderSummaryMeta('Allowed values', parameter.allowedValues)
    : '';

  return `
    <div class="summary-row__heading">
      <strong>${escapeHtml(parameter.name)}</strong>
      <span class="badge ${requirementClass}">${requirementLabel}</span>
    </div>
    <p class="summary-row__body">${escapeHtml(parameter.question)}</p>
    ${allowedValues}
  `;
}

function renderRecommendationSummary(recommendation) {
  const decision = escapeHtml(recommendation.final_decision);
  const decisionClass = decision.toLowerCase();
  const nextSteps = recommendation.next_steps
    ? renderSummaryMeta('Next steps', recommendation.next_steps)
    : '';
  const escalationNote = recommendation.escalation_note
    ? renderSummaryMeta(
        'Escalation',
        recommendation.escalation_note,
        'summary-row__meta--alert',
      )
    : '';

  return `
    <div class="summary-row__heading">
      <span class="decision-badge decision-badge--${decisionClass}">${decision}</span>
      <span class="summary-row__id">${escapeHtml(recommendation.recommendation_id)}</span>
    </div>
    <p class="summary-row__body">${escapeHtml(recommendation.recommendation_text)}</p>
    ${nextSteps}
    ${escalationNote}
  `;
}

function renderSummaryMeta(label, value, modifierClass = '') {
  const className = `summary-row__meta ${modifierClass}`.trim();

  return `<p class="${className}"><span>${label}</span>${escapeHtml(value)}</p>`;
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
  clearLastMermaid();
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

function renderRuleConditions(conditions) {
  const items = conditions
    .map(({ question, value }) => {
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
