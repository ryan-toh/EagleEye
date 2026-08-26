import { appState, subscribeToStateChanges } from '../../../appState.js';
import { InMemorySearchIndex } from '../../../services/inMemorySearch.js';
import {
  selectTopic,
  selectQuestion,
  requestQuestionPreviewRefresh,
} from '../editorCoordinator.js';
import { setDomTopicValue } from '../1_topic/controller.js';
import { setDomQuestionValue } from '../2_question/controller.js';
import { setDomParamValue } from '../3_leadingQuestion/controller.js';
import {
  recomEditorDom,
  setAnswerSelectedState,
} from '../4_answerMatrix/dom.js';

const SEARCH_DELAY_MS = 180;
const RESULT_TYPES = ['topic', 'question', 'leadingQuestion', 'answer'];

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
      type: 'question',
      getItems: () => appState.questions,
      getId: (question) => question.question_id,
      getTitle: (question) => question.question_name,
      getContext: (question) => getTopicName(question.topic_id),
      fields: [{ name: 'question_name', weight: 8 }],
      onSelect: (question) => navigateToQuestion(question.topic_id, question.question_id),
    },
    {
      type: 'leadingQuestion',
      getItems: () => appState.leadingQuestions,
      getId: (leadingQuestion) => leadingQuestion.leadingQuestion_id,
      getTitle: (leadingQuestion) => leadingQuestion.leadingQuestion_name,
      getContext: (leadingQuestion) => getQuestionContext(leadingQuestion.question_id),
      fields: [
        { name: 'leadingQuestion_name', weight: 8 },
        { name: 'question_to_ask', weight: 4 },
        { name: 'allowed_values', weight: 2 },
      ],
      onSelect: (leadingQuestion) =>
        navigateToLeadingQuestion(leadingQuestion.question_id, leadingQuestion.leadingQuestion_id),
    },
    {
      type: 'answer',
      getItems: () => appState.answers,
      getId: (answer) => answer.answer_id,
      getTitle: (answer) => answer.final_decision || 'Clarify',
      getContext: getAnswerContext,
      fields: [
        { name: 'answer_text', weight: 6 },
        { name: 'next_steps', weight: 4 },
        { name: 'escalation_note', weight: 3 },
      ],
      onSelect: navigateToAnswer,
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

function getQuestionContext(questionId) {
  const question = appState.questions.find(
    (item) => String(item.question_id) === String(questionId),
  );
  if (!question) return '';
  return [getTopicName(question.topic_id), question.question_name]
    .filter(Boolean)
    .join(' → ');
}

function getAnswerContext(answer) {
  const rules = appState.rules.filter(
    (rule) =>
      String(rule.answer_id) ===
      String(answer.answer_id),
  );
  if (!rules.length) return 'Not assigned to an question';
  const context = getQuestionContext(rules[0].question_id);
  return rules.length > 1 ? `${context} (+${rules.length - 1} more)` : context;
}

function navigateToTopic(topicId) {
  setDomTopicValue(topicId);
  selectTopic(topicId);
}

function navigateToQuestion(topicId, questionId) {
  navigateToTopic(topicId);
  setDomQuestionValue(questionId);
  selectQuestion(questionId);
  requestQuestionPreviewRefresh();
}

function navigateToLeadingQuestion(questionId, leadingQuestionId) {
  const question = appState.questions.find(
    (item) => String(item.question_id) === String(questionId),
  );
  if (!question) return;
  navigateToQuestion(question.topic_id, questionId);
  setDomParamValue(leadingQuestionId);
}

function navigateToAnswer(answer) {
  const rule = appState.rules.find(
    (item) =>
      String(item.answer_id) ===
      String(answer.answer_id),
  );
  if (!rule) return;
  const question = appState.questions.find(
    (item) => String(item.question_id) === String(rule.question_id),
  );
  if (!question) return;
  navigateToQuestion(question.topic_id, question.question_id);
  recomEditorDom.recommSelect.value = answer.answer_id;
  setAnswerSelectedState(answer.answer_id);
}

function formatFieldName(fieldName) {
  return fieldName
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const typeLabels = {
  topic: 'Topics',
  question: 'Questions',
  leadingQuestion: 'LeadingQuestions',
  answer: 'Answers',
};
