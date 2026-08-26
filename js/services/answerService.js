import {
  appState,
  getQuestionLeadingQuestions,
  getQuestionRules,
  getAnswersForRules,
  makeUniqueId,
  removeRule,
  transaction,
  upsertAnswer,
  upsertRule,
} from '../appState.js';
import { str } from '../utils.js';
import {
  conditionsEqual,
  parseAllowedValues,
  serializeConditions,
  tryParseConditions as parseConditions,
} from '../domain/conditions.js';
import { normalizeAnswerAssignments } from '../domain/answerAssignments.js';

export { parseAllowedValues, parseConditions };

export function getLeadingQuestionsWithAllowedValues(questionId) {
  return getQuestionLeadingQuestions(questionId).filter(
    (param) => parseAllowedValues(param.allowed_values).length > 0,
  );
}

export function getAnswers() {
  return [...appState.answers].sort((a, b) =>
    str(a.answer_id).localeCompare(str(b.answer_id)),
  );
}

export function getAnswersForQuestion(questionId) {
  return getAnswersForRules(getQuestionRules(questionId)).sort((a, b) =>
    str(a.answer_id).localeCompare(str(b.answer_id)),
  );
}

export function getAnswerAssignments(questionId, answerId) {
  return getQuestionRules(questionId).filter(
    (rule) => str(rule.answer_id) === str(answerId),
  );
}

export function getRuleForCombination(questionId, combination) {
  return getQuestionRules(questionId).find((rule) => {
    const parsed = parseConditions(rule.conditions);
    return parsed && conditionsEqual(parsed, combination);
  });
}

export function saveAnswer({
  answerId,
  finalDecision,
  answerText,
  nextSteps,
  escalationNote,
}) {
  const id = getAnswerId(answerId);

  return upsertAnswer({
    answer_id: id,
    final_decision: str(finalDecision) || 'Clarify',
    answer_text:
      str(answerText) ||
      'Clarify before giving a final answer.',
    next_steps: nextSteps,
    escalation_note: escalationNote,
  });
}

export function saveAnswerAssignments(
  questionId,
  answerId,
  assignments,
) {
  if (!Array.isArray(assignments)) {
    return getAnswerAssignments(questionId, answerId).length;
  }

  const normalizedAssignments = validateAnswerAssignments(
    questionId,
    answerId,
    assignments,
  );

  return transaction(() => {
    const selectedKeys = getAssignmentConditionKeys(normalizedAssignments);
    let savedCount = 0;

    normalizedAssignments.forEach((assignment, index) => {
      saveAnswerAssignment(
        questionId,
        answerId,
        assignment,
        index,
      );
      savedCount = index + 1;
    });

    removeUnselectedAnswerAssignments(
      questionId,
      answerId,
      selectedKeys,
    );

    return savedCount;
  });
}

/** Ensures one answer owns each condition combination within an question. */
export function validateAnswerAssignments(
  questionId,
  answerId,
  assignments,
) {
  const normalizedAssignments = normalizeAnswerAssignments(assignments);
  const combinationKeys = new Set();

  normalizedAssignments.forEach((assignment) => {
    const combinationKey = stringifyConditions(assignment.conditions);
    if (combinationKeys.has(combinationKey)) {
      throw new Error(
        'Each leadingQuestion combination can only be assigned to one answer.',
      );
    }
    combinationKeys.add(combinationKey);

    const existingRule = getRuleForCombination(questionId, assignment.conditions);
    if (
      existingRule &&
      str(existingRule.answer_id) !== str(answerId)
    ) {
      throw new Error(
        'This leadingQuestion combination is already assigned to another answer.',
      );
    }
  });

  return normalizedAssignments;
}

function getAnswerId(answerId) {
  const existingId = str(answerId);
  if (existingId) return existingId;

  return makeUniqueId('REC', appState.answers, 'answer_id');
}

function getAssignmentConditionKeys(assignments) {
  const conditionKeys = assignments.map((assignment) => {
    return stringifyConditions(assignment.conditions);
  });

  return new Set(conditionKeys);
}

function saveAnswerAssignment(
  questionId,
  answerId,
  assignment,
  index,
) {
  const existingRule = getRuleForCombination(questionId, assignment.conditions);
  if (
    existingRule &&
    str(existingRule.answer_id) !== str(answerId)
  ) {
    throw new Error(
      'This leadingQuestion combination is already assigned to another answer.',
    );
  }
  const ruleId = existingRule?.rule_id || createRuleId();
  const conditions = stringifyConditions(assignment.conditions);
  const priority = assignment.priority || index + 1;

  upsertRule({
    rule_id: ruleId,
    question_id: questionId,
    conditions,
    answer_id: answerId,
    priority,
  });
}

function createRuleId() {
  return makeUniqueId('RULE', appState.rules, 'rule_id');
}

function removeUnselectedAnswerAssignments(
  questionId,
  answerId,
  selectedKeys,
) {
  const savedRules = getAnswerAssignments(questionId, answerId);

  savedRules.forEach((rule) => {
    const conditions = parseConditions(rule.conditions);
    const conditionKey = conditions && stringifyConditions(conditions);

    if (conditionKey && !selectedKeys.has(conditionKey)) {
      removeRule(rule.rule_id);
    }
  });
}

const stringifyConditions = serializeConditions;
