import { clearLastMermaid } from '../../ui/uiState.js';
import { escapeHtml, answerEmoji } from '../../utils.js';

export const previewDom = {};

export function initPreviewDomElements() {
  Object.assign(previewDom, {
    leadingQuestionsList: document.getElementById('leadingQuestionsList'),
    rulesList: document.getElementById('rulesList'),
    answersList: document.getElementById('answersList'),
    questionSummaryName: document.getElementById('questionSummaryName'),
    questionSummaryDescription: document.getElementById('questionSummaryDescription'),
    leadingQuestionCount: document.getElementById('leadingQuestionCount'),
    ruleCount: document.getElementById('ruleCount'),
    answerCount: document.getElementById('answerCount'),
    leadingQuestionCardCount: document.getElementById('leadingQuestionCardCount'),
    ruleCardCount: document.getElementById('ruleCardCount'),
    answerCardCount: document.getElementById('answerCardCount'),
    flowchartPanel: document.getElementById('flowchartPanel'),
    flowchart: document.getElementById('flowchart'),
    copyMermaidBtn: document.getElementById('copyMermaidBtn'),
    fullscreenFlowchartBtn: document.getElementById('fullscreenFlowchartBtn'),
  });
}

export function renderQuestionSummary(preview) {
  if (previewDom.questionSummaryName) {
    previewDom.questionSummaryName.textContent = preview.name;
  }
  if (previewDom.questionSummaryDescription) {
    previewDom.questionSummaryDescription.textContent = preview.description;
  }
  setSummaryCounts(
    preview.leadingQuestions.length,
    preview.rules.length,
    preview.answers.length,
  );

  previewDom.leadingQuestionsList.className = 'summary-list';
  previewDom.leadingQuestionsList.innerHTML = renderSummaryList(
    preview.leadingQuestions,
    renderLeadingQuestionSummary,
  );

  previewDom.rulesList.className = 'summary-list';
  previewDom.rulesList.innerHTML = renderSummaryList(
    preview.rules,
    (rule) => `
    <div class="summary-row__heading">
      <span class="priority-badge">Priority ${escapeHtml(rule.priority)}</span>
      <span class="summary-row__id" aria-label="Answer">${escapeHtml(rule.answerEmoji)}</span>
    </div>
    ${renderRuleConditions(rule.conditions)}
  `,
  );

  previewDom.answersList.className = 'summary-list';
  previewDom.answersList.innerHTML = renderSummaryList(
    preview.answers,
    renderAnswerSummary,
  );
}

function renderLeadingQuestionSummary(leadingQuestion) {
  const requirementClass = leadingQuestion.required ? 'required' : 'optional';
  const requirementLabel = leadingQuestion.required ? 'Required' : 'Optional';
  const allowedValues = leadingQuestion.allowedValues
    ? renderSummaryMeta('Allowed values', leadingQuestion.allowedValues)
    : '';

  return `
    <div class="summary-row__heading">
      <strong>${escapeHtml(leadingQuestion.name)}</strong>
      <span class="badge ${requirementClass}">${requirementLabel}</span>
    </div>
    <p class="summary-row__body">${escapeHtml(leadingQuestion.question)}</p>
    ${allowedValues}
  `;
}

function renderAnswerSummary(answer) {
  const decision = escapeHtml(answer.final_decision);
  const decisionClass = decision.toLowerCase();
  const nextSteps = answer.next_steps
    ? renderSummaryMeta('Next steps', answer.next_steps)
    : '';
  const escalationNote = answer.escalation_note
    ? renderSummaryMeta(
        'Escalation',
        answer.escalation_note,
        'summary-row__meta--alert',
      )
    : '';

  return `
    <div class="summary-row__heading">
      <span class="decision-badge decision-badge--${decisionClass}">${decision}</span>
      <span class="summary-row__id" aria-label="Answer">${escapeHtml(answerEmoji(answer.final_decision))}</span>
    </div>
    <p class="summary-row__body">${escapeHtml(answer.answer_text)}</p>
    ${nextSteps}
    ${escalationNote}
  `;
}

function renderSummaryMeta(label, value, modifierClass = '') {
  const className = `summary-row__meta ${modifierClass}`.trim();

  return `<p class="${className}"><span>${label}</span>${escapeHtml(value)}</p>`;
}

export function renderEmptyQuestionView() {
  if (previewDom.questionSummaryName) {
    previewDom.questionSummaryName.textContent = 'No question selected';
  }
  if (previewDom.questionSummaryDescription) {
    previewDom.questionSummaryDescription.textContent =
      'Select an question to review its decision setup.';
  }
  setSummaryCounts(0, 0, 0);
  previewDom.leadingQuestionsList.className = 'summary-list empty';
  previewDom.leadingQuestionsList.textContent = 'No question selected.';

  previewDom.rulesList.className = 'summary-list empty';
  previewDom.rulesList.textContent = 'No question selected.';

  previewDom.answersList.className = 'summary-list empty';
  previewDom.answersList.textContent = 'No question selected.';

  previewDom.flowchart.className = 'flowchart empty';
  previewDom.flowchart.textContent = 'Load files and select an question.';

  previewDom.copyMermaidBtn.disabled = true;
  clearLastMermaid();
}

function setSummaryCounts(leadingQuestionCount, ruleCount, answerCount) {
  const counts = [
    [
      leadingQuestionCount,
      'leadingQuestion',
      previewDom.leadingQuestionCount,
      previewDom.leadingQuestionCardCount,
    ],
    [ruleCount, 'rule', previewDom.ruleCount, previewDom.ruleCardCount],
    [
      answerCount,
      'answer',
      previewDom.answerCount,
      previewDom.answerCardCount,
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
  if (!items.length) return '<p class="empty">None found for this question.</p>';
  return `<div class="summary-list">${items
    .map((item) => `<article class="summary-row">${renderer(item)}</article>`)
    .join('')}</div>`;
}

function renderRuleConditions(conditions) {
  const items = conditions
    .map(({ question, value }) => {
      return `
      <li class="rule-conditions__item">
        <span class="rule-conditions__label">LeadingQuestion:</span>
        <span class="rule-conditions__name">${escapeHtml(question)}</span>
        <span class="rule-conditions__label">Response:</span>
        <span class="rule-conditions__value">${escapeHtml(value)}</span>
      </li>
    `;
    })
    .join('');

  return `<ul class="rule-conditions">${items}</ul>`;
}
