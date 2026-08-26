import { str } from '../utils.js';

export function parseAllowedValues(value) {
  return str(value)
    .split(/[|;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseConditions(value) {
  const parsed =
    value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : JSON.parse(str(value));

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Rule conditions must be a JSON object.');
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([leadingQuestionId, response]) => [
      str(leadingQuestionId),
      str(response),
    ]),
  );
}

export function tryParseConditions(value) {
  try {
    return parseConditions(value);
  } catch {
    return null;
  }
}

export function serializeConditions(conditions) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(parseConditions(conditions)).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    ),
  );
}

export function conditionsEqual(first, second) {
  return serializeConditions(first) === serializeConditions(second);
}

export function referencesLeadingQuestion(conditions, leadingQuestionId) {
  const parsed = tryParseConditions(conditions);
  return parsed ? Object.hasOwn(parsed, str(leadingQuestionId)) : false;
}

export function validateRuleConditions(conditions, questionId, leadingQuestions) {
  const parsed = parseConditions(conditions);
  const leadingQuestionsById = new Map(
    leadingQuestions
      .filter((leadingQuestion) => str(leadingQuestion.question_id) === str(questionId))
      .map((leadingQuestion) => [str(leadingQuestion.leadingQuestion_id), leadingQuestion]),
  );

  Object.entries(parsed).forEach(([leadingQuestionId, response]) => {
    const leadingQuestion = leadingQuestionsById.get(leadingQuestionId);
    if (!leadingQuestion) {
      throw new Error(
        `Rule condition leadingQuestion_id ${leadingQuestionId} does not belong to question_id ${questionId}.`,
      );
    }

    const allowedValues = parseAllowedValues(leadingQuestion.allowed_values);
    if (!allowedValues.includes(response)) {
      throw new Error(
        `Rule condition value "${response}" is not allowed for leadingQuestion_id ${leadingQuestionId}.`,
      );
    }
  });

  return parsed;
}
