import { str } from './utils.js';
import { validateStateRelationships } from './domain/validation.js';
import {
  referencesParameter,
  validateRuleConditions,
} from './domain/conditions.js';
import {
  readLocalState,
  saveDecisionTreeState as persistState,
} from './persistence/localState.js';

// core appState
export const appState = {
  topics: [],
  issues: [],
  parameters: [],
  rules: [],
  recommendations: [],
};

let transactionDepth = 0;
let hasPendingPersistence = false;
let transactionFailed = false;

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
  Object.assign(appState, candidate);
}

export function loadLocalState() {
  const savedState = readLocalState();
  const candidate = createStateSnapshot(savedState);
  validateStateRelationships(candidate);
  Object.assign(appState, candidate);
}

export function saveToLocalState() {
  persistState(appState);
}

export function getWorkbookData() {
  const { topics, issues, parameters, rules, recommendations } = appState;
  return { topics, issues, parameters, rules, recommendations };
}

export function getIssuesForTopic(topicId) {
  return appState.issues.filter(
    (issue) => str(issue.topic_id) === str(topicId),
  );
}

export function getIssue(issueId) {
  return appState.issues.find((issue) => str(issue.issue_id) === str(issueId));
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

export function getIssueParameters(issueId) {
  return appState.parameters
    .filter((param) => str(param.issue_id) === str(issueId))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function getIssueRules(issueId) {
  return appState.rules
    .filter((rule) => str(rule.issue_id) === str(issueId))
    .sort(
      (a, b) => Number(a.priority || 999999) - Number(b.priority || 999999),
    );
}

function getRecommendation(recommendationId) {
  return appState.recommendations.find(
    (rec) => str(rec.recommendation_id) === str(recommendationId),
  );
}

export function getRecommendationsForRules(rules) {
  const ids = new Set(rules.map((rule) => str(rule.recommendation_id)));
  return appState.recommendations.filter((rec) =>
    ids.has(str(rec.recommendation_id)),
  );
}

export function getRecommendationMap() {
  return new Map(
    appState.recommendations.map((rec) => [str(rec.recommendation_id), rec]),
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

export function upsertIssue(issue) {
  const normalized = {
    issue_id: str(issue.issue_id),
    topic_id: str(issue.topic_id),
    issue_name: str(issue.issue_name),
    issue_description: str(issue.issue_description),
    example_phrases: str(issue.example_phrases),
  };

  requireFields(normalized, ['issue_id', 'topic_id', 'issue_name'], 'issue');

  if (!getTopic(normalized.topic_id)) {
    throw new Error(
      `Cannot save issue: topic_id ${normalized.topic_id} does not exist.`,
    );
  }

  upsertById(appState.issues, 'issue_id', normalized);
  requestPersistence();
  return normalized;
}

export function upsertParameter(parameter) {
  const normalized = {
    issue_id: str(parameter.issue_id),
    parameter_id: str(parameter.parameter_id),
    parameter_name: str(parameter.parameter_name),
    question_to_ask: str(parameter.question_to_ask),
    required: str(parameter.required || 'yes'),
    allowed_values: str(parameter.allowed_values),
    example_values: str(parameter.example_values),
    order: str(parameter.order || nextParameterOrder(parameter.issue_id)),
  };

  requireFields(
    normalized,
    [
      'issue_id',
      'parameter_id',
      'parameter_name',
      'question_to_ask',
      'required',
      'order',
    ],
    'parameter',
  );

  if (!getIssue(normalized.issue_id)) {
    throw new Error(
      `Cannot save parameter: issue_id ${normalized.issue_id} does not exist.`,
    );
  }

  const existingIndex = appState.parameters.findIndex(
    (param) =>
      str(param.issue_id) === normalized.issue_id &&
      str(param.parameter_id) === normalized.parameter_id,
  );

  if (existingIndex >= 0) {
    appState.parameters[existingIndex] = {
      ...appState.parameters[existingIndex],
      ...normalized,
    };
  } else {
    appState.parameters.push(normalized);
  }

  requestPersistence();
  return normalized;
}

export function moveIssueToTopic(issueId, topicId) {
  const issue = getIssue(issueId);
  const targetTopic = getTopic(topicId);

  if (!issue)
    throw new Error(`Cannot move issue: issue_id ${issueId} does not exist.`);
  if (!targetTopic)
    throw new Error(`Cannot move issue: topic_id ${topicId} does not exist.`);
  if (str(issue.topic_id) === str(topicId)) return issue;

  issue.topic_id = str(topicId);

  requestPersistence();
  return issue;
}

export function moveParameterToIssue(parameterId, issueId) {
  return transaction(() => {
    const parameter = appState.parameters.find(
      (param) => str(param.parameter_id) === str(parameterId),
    );
    const targetIssue = getIssue(issueId);

    if (!parameter)
      throw new Error(
        `Cannot move parameter: parameter_id ${parameterId} does not exist.`,
      );
    if (!targetIssue)
      throw new Error(
        `Cannot move parameter: issue_id ${issueId} does not exist.`,
      );
    if (str(parameter.issue_id) === str(issueId)) return parameter;

    appState.rules
      .filter((rule) => referencesParameter(rule.conditions, parameterId))
      .map((rule) => rule.rule_id)
      .forEach(removeRule);
    parameter.issue_id = str(issueId);
    parameter.order = str(nextParameterOrder(issueId));
    requestPersistence();
    return parameter;
  });
}

export function upsertRecommendation(recommendation) {
  const normalized = {
    recommendation_id: str(recommendation.recommendation_id),
    final_decision: str(recommendation.final_decision),
    recommendation_text: str(recommendation.recommendation_text),
    next_steps: str(recommendation.next_steps),
    escalation_note: str(recommendation.escalation_note),
  };

  requireFields(
    normalized,
    ['recommendation_id', 'final_decision', 'recommendation_text'],
    'recommendation',
  );
  upsertById(appState.recommendations, 'recommendation_id', normalized);

  requestPersistence();
  return normalized;
}

export function upsertRule(rule) {
  const normalized = {
    rule_id: str(rule.rule_id),
    issue_id: str(rule.issue_id),
    conditions: str(rule.conditions),
    recommendation_id: str(rule.recommendation_id),
    priority: str(rule.priority),
  };

  requireFields(
    normalized,
    ['rule_id', 'issue_id', 'conditions', 'recommendation_id', 'priority'],
    'rule',
  );

  if (!getIssue(normalized.issue_id)) {
    throw new Error(
      `Cannot save rule: issue_id ${normalized.issue_id} does not exist.`,
    );
  }

  if (!getRecommendation(normalized.recommendation_id)) {
    throw new Error(
      `Cannot save rule: recommendation_id ${normalized.recommendation_id} does not exist.`,
    );
  }

  validateRuleConditions(
    normalized.conditions,
    normalized.issue_id,
    appState.parameters,
  );

  upsertById(appState.rules, 'rule_id', normalized);

  requestPersistence();
  return normalized;
}

/*
Removes a topic from the appState.
Deletes all issues, parameters, rules & recommendations associated with the topicId
*/
export function removeTopic(topicId) {
  transaction(() => {
    appState.issues
      .filter((issue) => str(issue.topic_id) === str(topicId))
      .map((issue) => issue.issue_id)
      .forEach(removeIssue);
    removeById(appState.topics, 'topic_id', topicId);
    requestPersistence();
  });
}

/*
Removes an issue from the appState.
Deletes all parameters, rules & recommendations associated with the issueId
*/
export function removeIssue(issueId) {
  transaction(() => {
    appState.parameters
      .filter((param) => str(param.issue_id) === str(issueId))
      .map((param) => param.parameter_id)
      .forEach(removeParameter);
    removeById(appState.issues, 'issue_id', issueId);
    requestPersistence();
  });
}

/*
Removes a parameter from the appState.
Deletes all rules & recommendations associated with the paramId
*/
export function removeParameter(paramId) {
  transaction(() => {
    appState.rules
      .filter((rule) => referencesParameter(rule.conditions, paramId))
      .map((rule) => rule.rule_id)
      .forEach(removeRule);
    removeById(appState.parameters, 'parameter_id', paramId);
    requestPersistence();
  });
}

/*
Removes a rule from the appState.
Deletes all recommendations associated with the ruleId if no longer used
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
        (item) => str(item.recommendation_id) === str(rule.recommendation_id),
      )
    ) {
      removeRecommendation(rule.recommendation_id);
    }
    requestPersistence();
  });
}

/*
Removes a recommendation from the appState.
*/
function removeRecommendation(recomId) {
  removeById(appState.recommendations, 'recommendation_id', recomId);
  requestPersistence();
}

/** Removes a recommendation and every rule that assigns it. */
export function deleteRecommendation(recommendationId) {
  transaction(() => {
    appState.rules = appState.rules.filter(
      (rule) => str(rule.recommendation_id) !== str(recommendationId),
    );
    removeById(appState.recommendations, 'recommendation_id', recommendationId);
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

function nextParameterOrder(issueId) {
  const current = getIssueParameters(issueId).map((param) =>
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
    issues: data.issues ?? [],
    parameters: data.parameters ?? [],
    rules: data.rules ?? [],
    recommendations: data.recommendations ?? [],
  };
}
