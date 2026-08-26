import {
  appState,
  getQuestionLeadingQuestions,
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
  getAnswerAssignments,
  getAnswers,
  getAnswersForQuestion,
  getLeadingQuestionsWithAllowedValues,
  parseAllowedValues,
  parseConditions,
} from '../../../services/answerService.js';

export const recomEditorDom = {};

export function initRecomEditorDom() {
  Object.assign(recomEditorDom, {
    createAnswerBtn: document.getElementById('createAnswerBtn'),
    recommSelect: document.getElementById('editorAnswerSelect'),
    recommList: document.getElementById('editorAnswerList'),
    recommPanelHint: document.getElementById('editorAnswerPanelHint'),
    recommDialog: document.getElementById('editorAnswerDialog'),
    answerId: document.getElementById('editorAnswerId'),
    answerDecision: document.getElementById(
      'editorAnswerDecision',
    ),
    answerText: document.getElementById('editorAnswerText'),
    answerNextSteps: document.getElementById(
      'editorAnswerNextSteps',
    ),
    answerEscalationNote: document.getElementById(
      'editorAnswerEscalationNote',
    ),
    answerAssignments: document.getElementById(
      'editorAnswerAssignments',
    ),
    addAnswerAssignmentBtn: document.getElementById(
      'addAnswerAssignmentBtn',
    ),
    saveAnswerBtn: document.getElementById('saveAnswerBtn'),
  });
}

/** Controller Functions */

export function setAnswerSelectedState(answerId) {
  setExplorerSelectedState(
    recomEditorDom.recommList,
    'answerId',
    answerId,
  );
}

export function renderAnswerOptions(questionId) {
  recomEditorDom.recommPanelHint.textContent = questionId
    ? 'Create or double click on answer to edit'
    : 'Select an question first';

  if (!questionId) {
    renderExplorerEmpty(recomEditorDom.recommList, 'Select an question first');
    return;
  }

  const answers = getAnswersForQuestion(questionId);
  renderExplorerList({
    container: recomEditorDom.recommList,
    items: answers,
    query: '',
    selectedId: recomEditorDom.recommSelect.value,
    datasetKey: 'answerId',
    getId: (answer) => answer.answer_id,
    getTitle: (answer) => answer.final_decision || 'Clarify',
    getMeta: (answer) => getAnswerMeta(questionId, answer),
    type: 'answer',
    icon: '✦',
    emptyMessage: (allAnswers) =>
      allAnswers.length
        ? 'No answers match your search'
        : 'No answers assigned to this question yet',
  });
}

export function getClickedAnswerId(event) {
  return getClickedExplorerId(event, 'answerId');
}

export function renderAnswerFormFor(answerId, questionId) {
  const answer = getAnswers().find(
    (item) => str(item.answer_id) === str(answerId),
  );
  recomEditorDom.answerId.value =
    answer?.answer_id ||
    makeUniqueId('REC', appState.answers, 'answer_id');
  recomEditorDom.answerDecision.value =
    answer?.final_decision || 'Answered';
  recomEditorDom.answerText.value =
    answer?.answer_text || '';
  recomEditorDom.answerNextSteps.value =
    answer?.next_steps || '';
  recomEditorDom.answerEscalationNote.value =
    answer?.escalation_note || '';
  renderAssignmentChoices(questionId, answer?.answer_id);
}

export function collectAnswerAssignments() {
  const assignmentElements =
    recomEditorDom.answerAssignments.querySelectorAll(
      '[data-answer-assignment]',
    );

  return [...assignmentElements].map(readAnswerAssignment);
}

export function addAnswerAssignment() {
  if (!assignmentLeadingQuestions.length) return;
  recomEditorDom.answerAssignments.insertAdjacentHTML(
    'beforeend',
    renderAssignmentCard(),
  );
}

export function handleAnswerAssignmentClick(event) {
  const assignment = event.target.closest('[data-answer-assignment]');
  if (!assignment) return;

  if (event.target.closest('[data-remove-assignment]')) {
    assignment.remove();
    return;
  }

  if (event.target.closest('[data-add-condition]')) {
    assignment
      .querySelector('.answer-assignment__conditions')
      .insertAdjacentHTML('beforeend', renderCondition());
    if (assignment.dataset.autoPriority === 'true') {
      assignment.querySelector('.answer-assignment__priority').value =
        1;
    }
    return;
  }

  if (event.target.closest('[data-remove-condition]')) {
    const conditions = assignment.querySelectorAll(
      '.answer-assignment__condition',
    );
    if (conditions.length === 1) {
      assignment.remove();
    } else {
      event.target.closest('.answer-assignment__condition').remove();
    }
  }
}

export function handleAnswerAssignmentChange(event) {
  if (event.target.matches('.answer-assignment__priority')) {
    event.target.closest(
      '[data-answer-assignment]',
    ).dataset.autoPriority = 'false';
    return;
  }

  const leadingQuestionSelect = event.target.closest(
    '.answer-assignment__leadingQuestion',
  );
  if (!leadingQuestionSelect) return;

  const valueSelect = leadingQuestionSelect
    .closest('.answer-assignment__condition')
    .querySelector('.answer-assignment__value');
  valueSelect.innerHTML = renderValueOptions(leadingQuestionSelect.value);
}

let assignmentLeadingQuestions = [];

function renderAssignmentChoices(questionId, answerId) {
  if (!questionId) {
    renderAssignmentQuestionRequiredMessage();
    recomEditorDom.addAnswerAssignmentBtn.disabled = true;
    return;
  }

  assignmentLeadingQuestions = getLeadingQuestionsWithAllowedValues(questionId);
  const hasAssignmentLeadingQuestions = assignmentLeadingQuestions.length > 0;
  recomEditorDom.addAnswerAssignmentBtn.disabled =
    !hasAssignmentLeadingQuestions;

  const assignments = getAssignmentsForAnswer(
    questionId,
    answerId,
  );

  if (!hasAssignmentLeadingQuestions) {
    renderAssignmentsWithoutAllowedValues(questionId, assignments);
    return;
  }

  renderAssignmentsWithAllowedValues(assignments);
}

function getAnswerMeta(questionId, answer) {
  const assignments = getAnswerAssignments(
    questionId,
    answer.answer_id,
  );
  const assignmentCount = assignments.length;
  const assignmentLabel = assignmentCount === 1 ? 'assignment' : 'assignments';
  const responseText = answer.answer_text || 'No response text';

  return `${assignmentCount} ${assignmentLabel} · ${responseText}`;
}

function readAnswerAssignment(assignmentElement) {
  const conditionElements = assignmentElement.querySelectorAll(
    '.answer-assignment__condition',
  );
  const conditions = [...conditionElements].map(readAssignmentCondition);
  const priorityInput = assignmentElement.querySelector(
    '.answer-assignment__priority',
  );

  return { conditions, priority: priorityInput.value };
}

function readAssignmentCondition(conditionElement) {
  const leadingQuestionSelect = conditionElement.querySelector(
    '.answer-assignment__leadingQuestion',
  );
  const valueSelect = conditionElement.querySelector(
    '.answer-assignment__value',
  );

  return {
    leadingQuestionId: leadingQuestionSelect.value,
    value: valueSelect.value,
  };
}

function renderAssignmentQuestionRequiredMessage() {
  recomEditorDom.answerAssignments.innerHTML =
    '<p class="helper-text">Save the answer now; select an question before adding assignments.</p>';
}

function getAssignmentsForAnswer(questionId, answerId) {
  if (!answerId) return [];
  return getAnswerAssignments(questionId, answerId);
}

function renderAssignmentsWithoutAllowedValues(questionId, assignments) {
  if (assignments.length) {
    recomEditorDom.answerAssignments.innerHTML =
      renderDirectAssignments(assignments);
    return;
  }

  const hasLeadingQuestions = getQuestionLeadingQuestions(questionId).length > 0;
  recomEditorDom.answerAssignments.innerHTML = hasLeadingQuestions
    ? renderMissingAllowedValuesMessage()
    : renderDirectAssignmentCard();
}

function renderAssignmentsWithAllowedValues(assignments) {
  if (!assignments.length) {
    recomEditorDom.answerAssignments.innerHTML =
      renderNoAssignmentsMessage();
    return;
  }

  recomEditorDom.answerAssignments.innerHTML = assignments
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
  return '<p class="helper-text">Add allowed values to leadingQuestions before adding an assignment.</p>';
}

function renderNoAssignmentsMessage() {
  return '<p class="helper-text">No assignments yet. Add one to define when this answer should be used.</p>';
}

function renderAssignmentCard(conditions = {}, priority) {
  const entries = Object.entries(conditions);
  const conditionRows = (entries.length ? entries : [['', '']])
    .map(([leadingQuestionId, value]) => renderCondition(leadingQuestionId, value))
    .join('');
  const defaultPriority = 1;
  const autoPriority = priority ? 'false' : 'true';
  const priorityInput = renderPriorityInput(priority || defaultPriority);

  return `
    <section class="answer-assignment" data-answer-assignment data-auto-priority="${autoPriority}">
      <div class="answer-assignment__header">
        <strong>Use this answer when</strong>
        <button class="answer-assignment__remove" type="button" data-remove-assignment>Remove</button>
      </div>
      <div class="answer-assignment__conditions">${conditionRows}</div>
      <div class="answer-assignment__footer">
        <button type="button" data-add-condition>Add another condition</button>
        <span class="helper-text">Other leadingQuestions are not needed.</span>
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
    <section class="answer-assignment" data-answer-assignment>
      <div class="answer-assignment__header">
        <strong>Use this answer directly</strong>
        <button class="answer-assignment__remove" type="button" data-remove-assignment>Remove</button>
      </div>
      <p class="helper-text">This question has no leadingQuestions, so the answer is applied directly.</p>
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
        class="answer-assignment__priority"
        type="number"
        min="1"
        value="${escapedPriority}"
      />
    </label>
  `;
}

function renderCondition(selectedLeadingQuestionId = '', selectedValue = '') {
  const leadingQuestionOptions = renderLeadingQuestionOptions(selectedLeadingQuestionId);
  const valueOptions = renderValueOptions(selectedLeadingQuestionId, selectedValue);

  return `
    <div class="answer-assignment__condition">
      <span class="answer-assignment__condition-label">LeadingQuestion</span>
      <select class="answer-assignment__leadingQuestion">
        <option value="">Choose a question</option>
        ${leadingQuestionOptions}
      </select>
      <span class="answer-assignment__condition-label">Response</span>
      <select class="answer-assignment__value">${valueOptions}</select>
      <button
        class="answer-assignment__remove-condition"
        type="button"
        data-remove-condition
        aria-label="Remove condition"
      >
        ×
      </button>
    </div>`;
}

function renderLeadingQuestionOptions(selectedLeadingQuestionId) {
  return assignmentLeadingQuestions
    .map((leadingQuestion) => renderLeadingQuestionOption(leadingQuestion, selectedLeadingQuestionId))
    .join('');
}

function renderLeadingQuestionOption(leadingQuestion, selectedLeadingQuestionId) {
  const leadingQuestionId = str(leadingQuestion.leadingQuestion_id);
  const isSelected = leadingQuestionId === str(selectedLeadingQuestionId);
  const selectedAttribute = isSelected ? 'selected' : '';
  const label = leadingQuestion.question_to_ask || leadingQuestion.leadingQuestion_name;

  return `<option value="${escapeHtml(leadingQuestionId)}" ${selectedAttribute}>${escapeHtml(label)}</option>`;
}

function renderValueOptions(leadingQuestionId, selectedValue = '') {
  const leadingQuestion = assignmentLeadingQuestions.find(
    (item) => str(item.leadingQuestion_id) === str(leadingQuestionId),
  );
  const values = leadingQuestion ? parseAllowedValues(leadingQuestion.allowed_values) : [];
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
