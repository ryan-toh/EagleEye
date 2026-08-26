import { str } from './utils.js';
import { validateStateRelationships } from './domain/validation.js';
import {
  referencesLeadingQuestion,
  validateRuleConditions,
} from './domain/conditions.js';
import {
  readLocalState,
  saveDecisionTreeState as persistState,
} from './persistence/localState.js';

// core appState
export const appState = {
  topics: [],
  questions: [],
  leadingQuestions: [],
  rules: [],
  answers: [],
};

let transactionDepth = 0;
let hasPendingPersistence = false;
let transactionFailed = false;
const stateEvents = new EventTarget();

/** Batches related synchronous mutations into one validated state snapshot. */
export function transaction(action) {
  transactionDepth += 1;

  try {
    return action();
  } catch (error) {
    transactionFailed = true;
    throw error;
  } finally {
    transactionDepth -= 1;
    if (transactionDepth === 0) {
      if (!transactionFailed) flushPersistence();
      hasPendingPersistence = false;
      transactionFailed = false;
    }
  }
}

export function loadState(workbookData) {
  const candidate = createStateSnapshot(workbookData);
  validateStateRelationships(candidate);
  replaceState(candidate);
  notifyStateChange();
}

export function loadLocalState() {
  const savedState = readLocalState();
  const candidate = createStateSnapshot(savedState);
  validateStateRelationships(candidate);
  replaceState(candidate);
  notifyStateChange();
}

export function subscribeToStateChanges(handler) {
  stateEvents.addEventListener('change', handler);
  return () => stateEvents.removeEventListener('change', handler);
}

export function saveToLocalState() {
  persistState(appState);
}

export function getWorkbookData() {
  const { topics, questions, leadingQuestions, rules, answers } = appState;
  return { topics, questions, leadingQuestions, rules, answers };
}

export function getQuestionsForTopic(topicId) {
  return appState.questions.filter(
    (question) => str(question.topic_id) === str(topicId),
  );
}

export function getQuestion(questionId) {
  return appState.questions.find((question) => str(question.question_id) === str(questionId));
}

export function getTopic(topicId) {
  return appState.topics.find((item) => str(item.topic_id) === str(topicId));
}

export function getTopicName(topicId) {
  const topic = appState.topics.find(
    (item) => str(item.topic_id) === str(topicId),
  );
  return topic ? topic.topic_name : topicId;
}

export function getQuestionLeadingQuestions(questionId) {
  return appState.leadingQuestions
    .filter((param) => str(param.question_id) === str(questionId))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function getQuestionRules(questionId) {
  return appState.rules
    .filter((rule) => str(rule.question_id) === str(questionId))
    .sort(
      (a, b) => Number(a.priority || 999999) - Number(b.priority || 999999),
    );
}

function getAnswer(answerId) {
  return appState.answers.find(
    (rec) => str(rec.answer_id) === str(answerId),
  );
}

export function getAnswersForRules(rules) {
  const ids = new Set(rules.map((rule) => str(rule.answer_id)));
  return appState.answers.filter((rec) =>
    ids.has(str(rec.answer_id)),
  );
}

export function getAnswerMap() {
  return new Map(
    appState.answers.map((rec) => [str(rec.answer_id), rec]),
  );
}

export function upsertTopic(topic) {
  const normalized = {
    topic_id: str(topic.topic_id),
    topic_name: str(topic.topic_name),
    description: str(topic.description),
    example_phrases: str(topic.example_phrases),
  };

  requireFields(normalized, ['topic_id', 'topic_name'], 'topic');
  upsertById(appState.topics, 'topic_id', normalized);
  requestPersistence();
  console.log('saved topics');
  return normalized;
}

export function upsertQuestion(question) {
  const normalized = {
    question_id: str(question.question_id),
    topic_id: str(question.topic_id),
    question_name: str(question.question_name),
    question_description: str(question.question_description),
    example_phrases: str(question.example_phrases),
  };

  requireFields(normalized, ['question_id', 'topic_id', 'question_name'], 'question');

  if (!getTopic(normalized.topic_id)) {
    throw new Error(
      `Cannot save question: topic_id ${normalized.topic_id} does not exist.`,
    );
  }

  upsertById(appState.questions, 'question_id', normalized);
  requestPersistence();
  return normalized;
}

export function upsertLeadingQuestion(leadingQuestion) {
  const normalized = {
    question_id: str(leadingQuestion.question_id),
    leadingQuestion_id: str(leadingQuestion.leadingQuestion_id),
    leadingQuestion_name: str(leadingQuestion.leadingQuestion_name),
    question_to_ask: str(leadingQuestion.question_to_ask),
    required: str(leadingQuestion.required || 'yes'),
    allowed_values: str(leadingQuestion.allowed_values),
    example_values: str(leadingQuestion.example_values),
    order: str(leadingQuestion.order || nextLeadingQuestionOrder(leadingQuestion.question_id)),
  };

  requireFields(
    normalized,
    [
      'question_id',
      'leadingQuestion_id',
      'leadingQuestion_name',
      'question_to_ask',
      'required',
      'order',
    ],
    'leadingQuestion',
  );

  if (!getQuestion(normalized.question_id)) {
    throw new Error(
      `Cannot save leadingQuestion: question_id ${normalized.question_id} does not exist.`,
    );
  }

  const existingIndex = appState.leadingQuestions.findIndex(
    (param) =>
      str(param.question_id) === normalized.question_id &&
      str(param.leadingQuestion_id) === normalized.leadingQuestion_id,
  );

  if (existingIndex >= 0) {
    appState.leadingQuestions[existingIndex] = {
      ...appState.leadingQuestions[existingIndex],
      ...normalized,
    };
  } else {
    appState.leadingQuestions.push(normalized);
  }

  requestPersistence();
  return normalized;
}

export function moveQuestionToTopic(questionId, topicId) {
  const question = getQuestion(questionId);
  const targetTopic = getTopic(topicId);

  if (!question)
    throw new Error(`Cannot move question: question_id ${questionId} does not exist.`);
  if (!targetTopic)
    throw new Error(`Cannot move question: topic_id ${topicId} does not exist.`);
  if (str(question.topic_id) === str(topicId)) return question;

  question.topic_id = str(topicId);

  requestPersistence();
  return question;
}

export function moveLeadingQuestionToQuestion(leadingQuestionId, questionId) {
  return transaction(() => {
    const leadingQuestion = appState.leadingQuestions.find(
      (param) => str(param.leadingQuestion_id) === str(leadingQuestionId),
    );
    const targetQuestion = getQuestion(questionId);

    if (!leadingQuestion)
      throw new Error(
        `Cannot move leadingQuestion: leadingQuestion_id ${leadingQuestionId} does not exist.`,
      );
    if (!targetQuestion)
      throw new Error(
        `Cannot move leadingQuestion: question_id ${questionId} does not exist.`,
      );
    if (str(leadingQuestion.question_id) === str(questionId)) return leadingQuestion;

    appState.rules
      .filter((rule) => referencesLeadingQuestion(rule.conditions, leadingQuestionId))
      .map((rule) => rule.rule_id)
      .forEach(removeRule);
    leadingQuestion.question_id = str(questionId);
    leadingQuestion.order = str(nextLeadingQuestionOrder(questionId));
    requestPersistence();
    return leadingQuestion;
  });
}

export function upsertAnswer(answer) {
  const normalized = {
    answer_id: str(answer.answer_id),
    final_decision: str(answer.final_decision),
    answer_text: str(answer.answer_text),
    next_steps: str(answer.next_steps),
    escalation_note: str(answer.escalation_note),
  };

  requireFields(
    normalized,
    ['answer_id', 'final_decision', 'answer_text'],
    'answer',
  );
  upsertById(appState.answers, 'answer_id', normalized);

  requestPersistence();
  return normalized;
}

export function upsertRule(rule) {
  const normalized = {
    rule_id: str(rule.rule_id),
    question_id: str(rule.question_id),
    conditions: str(rule.conditions),
    answer_id: str(rule.answer_id),
    priority: str(rule.priority),
  };

  requireFields(
    normalized,
    ['rule_id', 'question_id', 'conditions', 'answer_id', 'priority'],
    'rule',
  );

  if (!getQuestion(normalized.question_id)) {
    throw new Error(
      `Cannot save rule: question_id ${normalized.question_id} does not exist.`,
    );
  }

  if (!getAnswer(normalized.answer_id)) {
    throw new Error(
      `Cannot save rule: answer_id ${normalized.answer_id} does not exist.`,
    );
  }

  validateRuleConditions(
    normalized.conditions,
    normalized.question_id,
    appState.leadingQuestions,
  );

  upsertById(appState.rules, 'rule_id', normalized);

  requestPersistence();
  return normalized;
}

/*
Removes a topic from the appState.
Deletes all questions, leadingQuestions, rules & answers associated with the topicId
*/
export function removeTopic(topicId) {
  transaction(() => {
    appState.questions
      .filter((question) => str(question.topic_id) === str(topicId))
      .map((question) => question.question_id)
      .forEach(removeQuestion);
    removeById(appState.topics, 'topic_id', topicId);
    requestPersistence();
  });
}

/*
Removes an question from the appState.
Deletes all leadingQuestions, rules & answers associated with the questionId
*/
export function removeQuestion(questionId) {
  transaction(() => {
    appState.leadingQuestions
      .filter((param) => str(param.question_id) === str(questionId))
      .map((param) => param.leadingQuestion_id)
      .forEach(removeLeadingQuestion);
    removeById(appState.questions, 'question_id', questionId);
    requestPersistence();
  });
}

/*
Removes a leadingQuestion from the appState.
Deletes all rules & answers associated with the paramId
*/
export function removeLeadingQuestion(paramId) {
  transaction(() => {
    appState.rules
      .filter((rule) => referencesLeadingQuestion(rule.conditions, paramId))
      .map((rule) => rule.rule_id)
      .forEach(removeRule);
    removeById(appState.leadingQuestions, 'leadingQuestion_id', paramId);
    requestPersistence();
  });
}

/*
Removes a rule from the appState.
Deletes all answers associated with the ruleId if no longer used
*/
export function removeRule(ruleId) {
  transaction(() => {
    const rule = appState.rules.find(
      (item) => str(item.rule_id) === str(ruleId),
    );
    if (!rule) return;
    removeById(appState.rules, 'rule_id', ruleId);
    if (
      !appState.rules.some(
        (item) => str(item.answer_id) === str(rule.answer_id),
      )
    ) {
      removeAnswer(rule.answer_id);
    }
    requestPersistence();
  });
}

/*
Removes a answer from the appState.
*/
function removeAnswer(recomId) {
  removeById(appState.answers, 'answer_id', recomId);
  requestPersistence();
}

/** Removes a answer and every rule that assigns it. */
export function deleteAnswer(answerId) {
  transaction(() => {
    appState.rules = appState.rules.filter(
      (rule) => str(rule.answer_id) !== str(answerId),
    );
    removeById(appState.answers, 'answer_id', answerId);
    requestPersistence();
  });
}

export function makeUniqueId(prefix, rows, idKey) {
  let counter = rows.length + 1;
  let candidate = `${prefix}_${String(counter).padStart(3, '0')}`;
  const existingIds = new Set(rows.map((row) => str(row[idKey])));

  while (existingIds.has(candidate)) {
    counter += 1;
    candidate = `${prefix}_${String(counter).padStart(3, '0')}`;
  }

  return candidate;
}

function nextLeadingQuestionOrder(questionId) {
  const current = getQuestionLeadingQuestions(questionId).map((param) =>
    Number(param.order || 0),
  );
  return current.length ? Math.max(...current) + 1 : 1;
}

function removeById(rows, idKey, id) {
  const index = rows.findIndex((row) => str(row[idKey]) === str(id));
  if (index >= 0) rows.splice(index, 1);
}

function requestPersistence() {
  hasPendingPersistence = true;
  if (transactionDepth === 0) flushPersistence();
}

function flushPersistence() {
  if (!hasPendingPersistence) return;
  validateStateRelationships(appState);
  persistState(appState);
  hasPendingPersistence = false;
  notifyStateChange();
}

function notifyStateChange() {
  stateEvents.dispatchEvent(new Event('change'));
}

function upsertById(rows, idKey, nextRow) {
  const index = rows.findIndex(
    (row) => str(row[idKey]) === str(nextRow[idKey]),
  );

  if (index >= 0) {
    rows[index] = { ...rows[index], ...nextRow };
  } else {
    rows.push(nextRow);
  }
}

function requireFields(row, fields, entityName) {
  const missing = fields.filter((field) => !str(row[field]));

  if (missing.length) {
    throw new Error(
      `Cannot save ${entityName}: missing ${missing.join(', ')}.`,
    );
  }
}

function createStateSnapshot(data) {
  return {
    topics: data.topics ?? [],
    questions: data.questions ?? [],
    leadingQuestions: data.leadingQuestions ?? [],
    rules: data.rules ?? [],
    answers: data.answers ?? [],
  };
}

/** Replaces every collection while preserving the public appState object. */
function replaceState(nextState) {
  Object.keys(appState).forEach((key) => {
    appState[key].splice(0, appState[key].length, ...nextState[key]);
  });
}
