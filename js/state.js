import { str } from './utils.js';

export const appState = {
  topics: [],
  issues: [],
  parameters: [],
  rules: [],
  recommendations: [],
  selectedTopicId: '',
  selectedIssueId: '',
  lastMermaid: ''
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

export function getRecommendationsForRules(rules) {
  const ids = new Set(rules.map(rule => str(rule.recommendation_id)));
  return appState.recommendations.filter(rec => ids.has(str(rec.recommendation_id)));
}

export function getRecommendationMap() {
  return new Map(appState.recommendations.map(rec => [str(rec.recommendation_id), rec]));
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