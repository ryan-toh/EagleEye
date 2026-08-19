import { str } from '../utils.js';
import { validateRuleConditions } from './conditions.js';

/** Validates foreign-key relationships */
export function validateStateRelationships(state) {
  validateStateShape(state);

  const topicIds = new Set(state.topics.map((topic) => str(topic.topic_id)));
  const issueIds = new Set(state.issues.map((issue) => str(issue.issue_id)));
  const recommendationIds = new Set(
    state.recommendations.map((rec) => str(rec.recommendation_id)),
  );

  assertNoOrphans(state.issues, 'topic_id', topicIds, 'issues');
  assertNoOrphans(state.parameters, 'issue_id', issueIds, 'parameters');
  assertNoOrphans(state.rules, 'issue_id', issueIds, 'rules');
  assertNoOrphans(state.rules, 'recommendation_id', recommendationIds, 'rules');
  state.rules.forEach((rule) =>
    validateRuleConditions(rule.conditions, rule.issue_id, state.parameters),
  );
}

function validateStateShape(state) {
  const collections = [
    'topics',
    'issues',
    'parameters',
    'rules',
    'recommendations',
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
