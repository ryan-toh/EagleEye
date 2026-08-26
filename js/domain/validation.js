import { str } from '../utils.js';
import { serializeConditions, validateRuleConditions } from './conditions.js';

/** Validates foreign-key relationships */
export function validateStateRelationships(state) {
  validateStateShape(state);

  const topicIds = new Set(state.topics.map((topic) => str(topic.topic_id)));
  const questionIds = new Set(state.questions.map((question) => str(question.question_id)));
  const answerIds = new Set(
    state.answers.map((rec) => str(rec.answer_id)),
  );

  assertNoOrphans(state.questions, 'topic_id', topicIds, 'questions');
  assertNoOrphans(state.leadingQuestions, 'question_id', questionIds, 'leadingQuestions');
  assertNoOrphans(state.rules, 'question_id', questionIds, 'rules');
  assertNoOrphans(state.rules, 'answer_id', answerIds, 'rules');
  state.rules.forEach((rule) =>
    validateRuleConditions(rule.conditions, rule.question_id, state.leadingQuestions),
  );
  assertUniqueRuleCombinations(state.rules);
}

function assertUniqueRuleCombinations(rules) {
  const ruleByCombination = new Map();

  rules.forEach((rule) => {
    const key = `${str(rule.question_id)}:${serializeConditions(rule.conditions)}`;
    const existingRule = ruleByCombination.get(key);
    if (existingRule) {
      throw new Error(
        `Rules ${existingRule.rule_id} and ${rule.rule_id} use the same leadingQuestion combination.`,
      );
    }
    ruleByCombination.set(key, rule);
  });
}

function validateStateShape(state) {
  const collections = [
    'topics',
    'questions',
    'leadingQuestions',
    'rules',
    'answers',
  ];

  collections.forEach((key) => {
    if (!Array.isArray(state[key])) {
      throw new Error(`Invalid decision data: ${key} must be an array.`);
    }
  });
}

function assertNoOrphans(rows, key, validIds, entityName) {
  const missing = rows.filter((row) => !validIds.has(str(row[key])));
  if (!missing.length) return;

  const referencedIds = missing.map((row) => str(row[key]));
  const nonEmptyIds = referencedIds.filter((id) => Boolean(id));
  const uniqueIds = new Set(nonEmptyIds);
  const ids = [...uniqueIds];

  throw new Error(
    `Some ${entityName} refer to missing ${key}(s): ${ids.join(', ')}`,
  );
}
