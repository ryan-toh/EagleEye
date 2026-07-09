import { str } from './utils.js';

export const appState = {
  topics: [],
  issues: [],
  parameters: [],
  rules: [],
  recommendations: [],
  selectedTopicId: '',
  selectedIssueId: '',
  lastMermaid: '',
  step: 1,
  flow: null
};

export function loadState(workbookData) {
  appState.topics = workbookData.topics || [];
  appState.issues = workbookData.issues || [];
  appState.parameters = workbookData.parameters || [];
  appState.rules = workbookData.rules || [];
  appState.recommendations = workbookData.recommendations || [];
  appState.selectedTopicId = '';
  appState.selectedIssueId = '';
  appState.lastMermaid = '';

  validateStateRelationships(appState);
}

export function setSelectedTopic(topicId) {
  appState.selectedTopicId = str(topicId);
  appState.selectedIssueId = '';
  appState.lastMermaid = '';
}

export function setSelectedIssue(issueId) {
  appState.selectedIssueId = str(issueId);
  appState.lastMermaid = '';
}

export function getIssuesForTopic(topicId) {
  return appState.issues.filter(issue => str(issue.topic_id) === str(topicId));
}

export function getIssue(issueId) {
  return appState.issues.find(issue => str(issue.issue_id) === str(issueId));
}

export function getTopic(topicId) {
  return appState.topics.find(item => str(item.topic_id) === str(topicId));
}

export function getTopicName(topicId) {
  const topic = appState.topics.find(item => str(item.topic_id) === str(topicId));
  return topic ? topic.topic_name : topicId;
}

export function getIssueParameters(issueId) {
  return appState.parameters
    .filter(param => str(param.issue_id) === str(issueId))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function getIssueRules(issueId) {
  return appState.rules
    .filter(rule => str(rule.issue_id) === str(issueId))
    .sort((a, b) => Number(a.priority || 999999) - Number(b.priority || 999999));
}

// export function getIssueRuleNames(issueId) {
// }

export function getRecommendation(recommendationId) {
  return appState.recommendations.find(rec => str(rec.recommendation_id) === str(recommendationId));
}

export function getRecommendationsForRules(rules) {
  const ids = new Set(rules.map(rule => str(rule.recommendation_id)));
  return appState.recommendations.filter(rec => ids.has(str(rec.recommendation_id)));
}

export function getRecommendationMap() {
  return new Map(appState.recommendations.map(rec => [str(rec.recommendation_id), rec]));
}

export function upsertTopic(topic) {
  const normalized = {
    topic_id: str(topic.topic_id),
    topic_name: str(topic.topic_name),
    description: str(topic.description),
    example_phrases: str(topic.example_phrases)
  };

  console.log(str(topic.description));
  requireFields(normalized, ['topic_id', 'topic_name'], 'topic');
  upsertById(appState.topics, topic_id, normalized);
  appState.selectedTopicId = normalized.topic_id;
  return normalized;
}

export function upsertIssue(issue) {
  const normalized = {
    issue_id: str(issue.issue_id),
    topic_id: str(issue.topic_id),
    issue_name: str(issue.issue_name),
    issue_description: str(issue.issue_description),
    example_phrases: str(issue.example_phrases)
  };

  requireFields(normalized, ['issue_id', 'topic_id', 'issue_name'], 'issue');

  if (!getTopic(normalized.topic_id)) {
    throw new Error(`Cannot save issue: topic_id ${normalized.topic_id} does not exist.`);
  }

  upsertById(appState.issues, 'issue_id', normalized);
  appState.selectedTopicId = normalized.topic_id;
  appState.selectedIssueId = normalized.issue_id;
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
    order: str(parameter.order || nextParameterOrder(parameter.issue_id))
  };

  requireFields(normalized, ['issue_id', 'parameter_id', 'parameter_name', 'question_to_ask', 'required', 'order'], 'parameter');

  if (!getIssue(normalized.issue_id)) {
    throw new Error(`Cannot save parameter: issue_id ${normalized.issue_id} does not exist.`);
  }

  const existingIndex = appState.parameters.findIndex(param =>
    str(param.issue_id) === normalized.issue_id && str(param.parameter_id) === normalized.parameter_id
  );

  if (existingIndex >= 0) {
    appState.parameters[existingIndex] = { ...appState.parameters[existingIndex], ...normalized };
  } else {
    appState.parameters.push(normalized);
  }

  return normalized;
}

export function upsertRecommendation(recommendation) {
  
  const normalized = {
    recommendation_id: str(recommendation.recommendation_id),
    final_decision: str(recommendation.final_decision),
    recommendation_text: str(recommendation.recommendation_text),
    next_steps: str(recommendation.next_steps),
    escalation_note: str(recommendation.escalation_note)
  };


  requireFields(normalized, ['recommendation_id', 'final_decision', 'recommendation_text'], 'recommendation');
  upsertById(appState.recommendations, 'recommendation_id', normalized);
  
  return normalized;
}

export function upsertRule(rule) {
  const normalized = {
    rule_id: str(rule.rule_id),
    issue_id: str(rule.issue_id),
    conditions: str(rule.conditions),
    recommendation_id: str(rule.recommendation_id),
    priority: str(rule.priority)
  };
  
  requireFields(normalized, ['rule_id', 'issue_id', 'conditions', 'recommendation_id', 'priority'], 'rule');

  if (!getIssue(normalized.issue_id)) {
    throw new Error(`Cannot save rule: issue_id ${normalized.issue_id} does not exist.`);
  }

  if (!getRecommendation(normalized.recommendation_id)) {
    throw new Error(`Cannot save rule: recommendation_id ${normalized.recommendation_id} does not exist.`);
  }

  upsertById(appState.rules, 'rule_id', normalized);
  return normalized;
}

export function makeUniqueId(prefix, rows, idKey) {
  let counter = rows.length + 1;
  let candidate = `${prefix}_${String(counter).padStart(3, '0')}`;
  const existingIds = new Set(rows.map(row => str(row[idKey])));

  while (existingIds.has(candidate)) {
    counter += 1;
    candidate = `${prefix}_${String(counter).padStart(3, '0')}`;
  }

  return candidate;
}

function nextParameterOrder(issueId) {
  const current = getIssueParameters(issueId).map(param => Number(param.order || 0));
  return current.length ? Math.max(...current) + 1: 1;
}

function upsertById(rows, idKey, nextRow) {
  const index = rows.findIndex(row => str(row[idKey]) === str(nextRow[idKey]));

  if (index >= 0) {
    rows[index] = { ...rows[index], ...rows[nextRow]};
  } else {
    rows.push(nextRow);
  }
}

function requireFields(row, fields, entityName) {
  const missing = fields.filter(field => !str(row[field]));

  if (missing.length) {
    throw new Error(`Cannot save ${entityName}: missing ${missing.join(', ')}.`);
  }
}


function validateStateRelationships(state) {
  const topicIds = new Set(state.topics.map(topic => str(topic.topic_id)));
  const issueIds = new Set(state.issues.map(issue => str(issue.issue_id)));
  const recommendationIds = new Set(state.recommendations.map(rec => str(rec.recommendation_id)));

  const orphanIssues = state.issues.filter(issue => !topicIds.has(str(issue.topic_id)));
  if (orphanIssues.length) {
    throw new Error(`Some issues refer to missing topic_id(s): ${uniqueValues(orphanIssues, 'topic_id').join(', ')}`);
  }

  const orphanParameters = state.parameters.filter(param => !issueIds.has(str(param.issue_id)));
  if (orphanParameters.length) {
    throw new Error(`Some parameters refer to missing issue_id(s): ${uniqueValues(orphanParameters, 'issue_id').join(', ')}`);
  }

  const orphanRules = state.rules.filter(rule => !issueIds.has(str(rule.issue_id)));
  if (orphanRules.length) {
    throw new Error(`Some rules refer to missing issue_id(s): ${uniqueValues(orphanRules, 'issue_id').join(', ')}`);
  }

  const missingRecommendations = state.rules.filter(rule => !recommendationIds.has(str(rule.recommendation_id)));
  if (missingRecommendations.length) {
    throw new Error(`Some rules refer to missing recommendation_id(s): ${uniqueValues(missingRecommendations, 'recommendation_id').join(', ')}`);
  }
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map(row => str(row[key])).filter(Boolean))];
}

/**
 * Updates the visibility of major UI components based on uiState
 */
export function renderStep() {
  const tabBar = document.getElementById('tab-bar');
  const viewPanel = document.getElementById('view-panel');
  const editorPanel = document.getElementById('editor-panel');
  const previewPanel = document.getElementById('preview-panel');

  // Toggle Tab Bar visibility
  tabBar.classList.toggle('hidden', appState.step < 2);

  // Toggle Flow Panels
  // Only show the panel if we are at step 2 or 3 AND the flow matches
  const isViewFlow = appState.step >= 2 && appState.flow === 'view';
  const isEditFlow = appState.step >= 2 && appState.flow === 'edit';

  viewPanel.classList.toggle('hidden', !isViewFlow);
  editorPanel.classList.toggle('hidden', !isEditFlow);

  // Toggle Preview Panel visibility
  previewPanel.classList.toggle('hidden', appState.step < 3);
}