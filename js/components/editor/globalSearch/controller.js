import { appState, subscribeToStateChanges } from '../../../appState.js';
import { InMemorySearchIndex } from '../../../services/inMemorySearch.js';
import {
  selectTopic,
  selectIssue,
  requestIssuePreviewRefresh,
} from '../editorCoordinator.js';
import { setDomTopicValue } from '../1_topic/controller.js';
import { setDomIssueValue } from '../2_issue/controller.js';
import { setDomParamValue } from '../3_parameter/controller.js';
import {
  recomEditorDom,
  setRecommendationSelectedState,
} from '../4_recommendationMatrix/dom.js';

const SEARCH_DELAY_MS = 180;
const RESULT_TYPES = ['topic', 'issue', 'parameter', 'recommendation'];

let searchIndex;
let searchInput;
let resultsContainer;
let debounceTimer;

export function initGlobalSearch() {
  searchInput = document.getElementById('editorGlobalSearch');
  resultsContainer = document.getElementById('editorGlobalSearchResults');
  searchIndex = new InMemorySearchIndex({ sources: createSearchSources() });

  searchInput.addEventListener('input', scheduleSearch);
  resultsContainer.addEventListener('click', selectResult);
  subscribeToStateChanges(rebuildIndex);
  rebuildIndex();
}

function createSearchSources() {
  return [
    {
      type: 'topic',
      getItems: () => appState.topics,
      getId: (topic) => topic.topic_id,
      getTitle: (topic) => topic.topic_name,
      fields: [{ name: 'topic_name', weight: 8 }],
      onSelect: (topic) => navigateToTopic(topic.topic_id),
    },
    {
      type: 'issue',
      getItems: () => appState.issues,
      getId: (issue) => issue.issue_id,
      getTitle: (issue) => issue.issue_name,
      getContext: (issue) => getTopicName(issue.topic_id),
      fields: [{ name: 'issue_name', weight: 8 }],
      onSelect: (issue) => navigateToIssue(issue.topic_id, issue.issue_id),
    },
    {
      type: 'parameter',
      getItems: () => appState.parameters,
      getId: (parameter) => parameter.parameter_id,
      getTitle: (parameter) => parameter.parameter_name,
      getContext: (parameter) => getIssueContext(parameter.issue_id),
      fields: [
        { name: 'parameter_name', weight: 8 },
        { name: 'question_to_ask', weight: 4 },
        { name: 'allowed_values', weight: 2 },
      ],
      onSelect: (parameter) =>
        navigateToParameter(parameter.issue_id, parameter.parameter_id),
    },
    {
      type: 'recommendation',
      getItems: () => appState.recommendations,
      getId: (recommendation) => recommendation.recommendation_id,
      getTitle: (recommendation) => recommendation.final_decision || 'Clarify',
      getContext: getRecommendationContext,
      fields: [
        { name: 'recommendation_text', weight: 6 },
        { name: 'next_steps', weight: 4 },
        { name: 'escalation_note', weight: 3 },
      ],
      onSelect: navigateToRecommendation,
    },
  ];
}

function rebuildIndex() {
  searchIndex.rebuild();
  searchInput.disabled = searchIndex.documents.size === 0;
  if (searchInput.disabled) clearResults();
  else if (searchInput.value) renderSearchResults();
}

function scheduleSearch() {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(renderSearchResults, SEARCH_DELAY_MS);
}

function renderSearchResults() {
  const query = searchInput.value.trim();
  if (!query) {
    clearResults();
    return;
  }

  const results = searchIndex.search(query);
  resultsContainer.replaceChildren();
  resultsContainer.hidden = false;

  if (!results.length) {
    const empty = document.createElement('p');
    empty.className = 'global-search__empty';
    empty.textContent = 'No matches found.';
    resultsContainer.append(empty);
    return;
  }

  RESULT_TYPES.forEach((type) => {
    const matches = results.filter((result) => result.type === type);
    if (!matches.length) return;

    const group = document.createElement('section');
    group.className = 'global-search__group';
    const heading = document.createElement('h3');
    heading.textContent = `${typeLabels[type]} (${matches.length})`;
    group.append(heading);
    matches.forEach((result) => group.append(createResultButton(result)));
    resultsContainer.append(group);
  });
}

function createResultButton(result) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'global-search__result';
  button.dataset.documentId = `${result.type}:${result.id}`;

  const title = document.createElement('span');
  title.className = 'global-search__result-title';
  title.textContent = result.title;
  button.append(title);

  const detail = document.createElement('span');
  detail.className = 'global-search__result-detail';
  const fieldText = result.matchedFields.map(formatFieldName).join(', ');
  detail.textContent = `Matched in: ${fieldText}`;
  button.append(detail);

  if (result.context) {
    const context = document.createElement('span');
    context.className = 'global-search__result-context';
    context.textContent = result.context;
    button.append(context);
  }
  return button;
}

function selectResult(event) {
  const button = event.target.closest('[data-document-id]');
  if (!button) return;

  const result = searchIndex.documents.get(button.dataset.documentId);
  result?.onSelect?.(result.item);
  searchInput.value = '';
  clearResults();
}

function clearResults() {
  resultsContainer.replaceChildren();
  resultsContainer.hidden = true;
}

function getTopicName(topicId) {
  return appState.topics.find(
    (topic) => String(topic.topic_id) === String(topicId),
  )?.topic_name;
}

function getIssueContext(issueId) {
  const issue = appState.issues.find(
    (item) => String(item.issue_id) === String(issueId),
  );
  if (!issue) return '';
  return [getTopicName(issue.topic_id), issue.issue_name]
    .filter(Boolean)
    .join(' → ');
}

function getRecommendationContext(recommendation) {
  const rules = appState.rules.filter(
    (rule) =>
      String(rule.recommendation_id) ===
      String(recommendation.recommendation_id),
  );
  if (!rules.length) return 'Not assigned to an issue';
  const context = getIssueContext(rules[0].issue_id);
  return rules.length > 1 ? `${context} (+${rules.length - 1} more)` : context;
}

function navigateToTopic(topicId) {
  setDomTopicValue(topicId);
  selectTopic(topicId);
}

function navigateToIssue(topicId, issueId) {
  navigateToTopic(topicId);
  setDomIssueValue(issueId);
  selectIssue(issueId);
  requestIssuePreviewRefresh();
}

function navigateToParameter(issueId, parameterId) {
  const issue = appState.issues.find(
    (item) => String(item.issue_id) === String(issueId),
  );
  if (!issue) return;
  navigateToIssue(issue.topic_id, issueId);
  setDomParamValue(parameterId);
}

function navigateToRecommendation(recommendation) {
  const rule = appState.rules.find(
    (item) =>
      String(item.recommendation_id) ===
      String(recommendation.recommendation_id),
  );
  if (!rule) return;
  const issue = appState.issues.find(
    (item) => String(item.issue_id) === String(rule.issue_id),
  );
  if (!issue) return;
  navigateToIssue(issue.topic_id, issue.issue_id);
  recomEditorDom.recommSelect.value = recommendation.recommendation_id;
  setRecommendationSelectedState(recommendation.recommendation_id);
}

function formatFieldName(fieldName) {
  return fieldName
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const typeLabels = {
  topic: 'Topics',
  issue: 'Issues',
  parameter: 'Parameters',
  recommendation: 'Recommendations',
};
