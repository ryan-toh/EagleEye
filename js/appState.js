import { str } from './utils.js';

// core appState
export const appState = {
  topics: [],
  issues: [],
  parameters: [],
  rules: [],
  recommendations: [],
  lastMermaid: '',
  step: 1,
};

export function loadState(workbookData) {
  appState.topics = workbookData.topics || [];
  appState.issues = workbookData.issues || [];
  appState.parameters = workbookData.parameters || [];
  appState.rules = workbookData.rules || [];
  appState.recommendations = workbookData.recommendations || [];
  appState.lastMermaid = '';

  validateStateRelationships(appState);
}

export function loadLocalState() {
  appState.topics = JSON.parse(localStorage.getItem('topics')) || [];
  appState.issues = JSON.parse(localStorage.getItem('issues')) || [];
  appState.parameters = JSON.parse(localStorage.getItem('parameters')) || [];
  appState.rules = JSON.parse(localStorage.getItem('rules')) || [];
  appState.recommendations =
    JSON.parse(localStorage.getItem('recommendations')) || [];
  appState.lastMermaid = localStorage.getItem('lastMermaid') || '';
  appState.step = Number.parseInt(localStorage.getItem('step'), 10) || 1;
}

export function saveToLocalState() {
  saveTopicsToLocalState();
  saveIssuesToLocalState();
  saveParametersToLocalState();
  saveRulesToLocalState();
  saveRecommendationsToLocalState();
  saveMermaidToLocalState();
  saveStepToLocalState();
}

export function saveMermaidToLocalState() {
  localStorage.setItem('lastMermaid', appState.lastMermaid);
}

export function saveStepToLocalState() {
  localStorage.setItem('step', String(appState.step));
}

export function saveTopicsToLocalState() {
  localStorage.setItem('topics', JSON.stringify(appState.topics));
}

export function saveIssuesToLocalState() {
  localStorage.setItem('issues', JSON.stringify(appState.issues));
}

export function saveParametersToLocalState() {
  localStorage.setItem('parameters', JSON.stringify(appState.parameters));
}

export function saveRulesToLocalState() {
  localStorage.setItem('rules', JSON.stringify(appState.rules));
}

export function saveRecommendationsToLocalState() {
  localStorage.setItem(
    'recommendations',
    JSON.stringify(appState.recommendations),
  );
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

export function getRecommendation(recommendationId) {
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
  saveTopicsToLocalState();
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
  saveIssuesToLocalState();
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

  saveParametersToLocalState();
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

  saveIssuesToLocalState();
  return issue;
}

export function moveParameterToIssue(parameterId, issueId) {
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

  const rulesToRemove = appState.rules
    .filter((rule) => {
      try {
        const conditions = JSON.parse(rule.conditions);
        return conditions && Object.hasOwn(conditions, str(parameterId));
      } catch {
        return false;
      }
    })
    .map((rule) => rule.rule_id);

  rulesToRemove.forEach(removeRule);
  parameter.issue_id = str(issueId);
  parameter.order = str(nextParameterOrder(issueId));

  saveParametersToLocalState();
  return parameter;
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

  saveRecommendationsToLocalState();
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

  upsertById(appState.rules, 'rule_id', normalized);

  saveRulesToLocalState();
  return normalized;
}

/*
Removes a topic from the appState.
Deletes all issues, parameters, rules & recommendations associated with the topicId
*/
export function removeTopic(topicId) {
  const toRemoveIssues = appState.issues
    .filter((issue) => str(issue.topic_id) === str(topicId))
    .flatMap((issue) => issue.issue_id);

  for (let i = 0; i < toRemoveIssues.length; i++) {
    removeIssue(toRemoveIssues[i]);
  }

  const index = appState.topics.findIndex(
    (topic) => str(topic.topic_id) === str(topicId),
  );

  if (index >= 0) {
    appState.topics.splice(index, 1);
  }

  saveTopicsToLocalState();
}

/*
Removes an issue from the appState.
Deletes all parameters, rules & recommendations associated with the issueId
*/
export function removeIssue(issueId) {
  const toRemoveParameters = appState.parameters
    .filter((param) => str(param.issue_id) === str(issueId))
    .flatMap((param) => param.parameter_id);

  for (let i = 0; i < toRemoveParameters.length; i++) {
    removeParameter(toRemoveParameters[i]);
  }

  const index = appState.issues.findIndex(
    (issue) => str(issue.issue_id) === str(issueId),
  );

  if (index >= 0) {
    appState.issues.splice(index, 1);
  }

  saveIssuesToLocalState();
}

/*
Removes a parameter from the appState.
Deletes all rules & recommendations associated with the paramId
*/
export function removeParameter(paramId) {
  const toRemoveRules = appState.rules
    .filter((rule) => {
      try {
        const conditions = JSON.parse(rule.conditions);
        return conditions && Object.hasOwn(conditions, str(paramId));
      } catch {
        return false;
      }
    })
    .flatMap((rule) => rule.rule_id);

  for (let j = 0; j < toRemoveRules.length; j++) {
    removeRule(toRemoveRules[j]);
  }

  const index = appState.parameters.findIndex(
    (param) => str(param.parameter_id) === str(paramId),
  );

  if (index >= 0) {
    appState.parameters.splice(index, 1);
  }

  saveParametersToLocalState();
}

/*
Removes a rule from the appState.
Deletes all recommendations associated with the ruleId if no longer used
*/
export function removeRule(ruleId) {
  const index = appState.rules.findIndex(
    (rule) => str(rule.rule_id) === str(ruleId),
  );

  if (index >= 0) {
    const recommendationId = appState.rules[index].recommendation_id;

    appState.rules.splice(index, 1);

    const isStillUsed = appState.rules.some(
      (rule) => str(rule.recommendation_id) === str(recommendationId),
    );

    if (!isStillUsed) {
      removeRecommendation(recommendationId);
    }
  }

  saveRulesToLocalState();
}

/*
Removes a recommendation from the appState.
*/
export function removeRecommendation(recomId) {
  const index = appState.recommendations.findIndex(
    (recom) => str(recom.recommendation_id) == str(recomId),
  );

  if (index >= 0) {
    appState.recommendations.splice(index, 1);
  }

  saveRecommendationsToLocalState();
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

function validateStateRelationships(state) {
  const topicIds = new Set(state.topics.map((topic) => str(topic.topic_id)));
  const issueIds = new Set(state.issues.map((issue) => str(issue.issue_id)));
  const recommendationIds = new Set(
    state.recommendations.map((rec) => str(rec.recommendation_id)),
  );

  const orphanIssues = state.issues.filter(
    (issue) => !topicIds.has(str(issue.topic_id)),
  );
  if (orphanIssues.length) {
    throw new Error(
      `Some issues refer to missing topic_id(s): ${uniqueValues(orphanIssues, 'topic_id').join(', ')}`,
    );
  }

  const orphanParameters = state.parameters.filter(
    (param) => !issueIds.has(str(param.issue_id)),
  );
  if (orphanParameters.length) {
    throw new Error(
      `Some parameters refer to missing issue_id(s): ${uniqueValues(orphanParameters, 'issue_id').join(', ')}`,
    );
  }

  const orphanRules = state.rules.filter(
    (rule) => !issueIds.has(str(rule.issue_id)),
  );
  if (orphanRules.length) {
    throw new Error(
      `Some rules refer to missing issue_id(s): ${uniqueValues(orphanRules, 'issue_id').join(', ')}`,
    );
  }

  const missingRecommendations = state.rules.filter(
    (rule) => !recommendationIds.has(str(rule.recommendation_id)),
  );
  if (missingRecommendations.length) {
    throw new Error(
      `Some rules refer to missing recommendation_id(s): ${uniqueValues(missingRecommendations, 'recommendation_id').join(', ')}`,
    );
  }
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => str(row[key])).filter(Boolean))];
}

/**
 * Updates the visibility of major UI components based on uiState
 */
export function renderStep() {
  const uploadPanel = document.getElementById('upload-panel');
  const editorPanel = document.getElementById('editor-panel');
  const previewPanel = document.getElementById('preview-panel');

  uploadPanel.classList.toggle('hidden', appState.step >= 2);

  // Toggle Editor Panel visibility
  editorPanel.classList.toggle('hidden', appState.step < 2);

  // Keep the preview visible throughout the editor workflow.
  previewPanel.classList.toggle('hidden', appState.step < 2);
}
