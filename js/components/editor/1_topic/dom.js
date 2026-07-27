import { appState, getTopic, makeUniqueId } from '../../../appState.js';
import { str } from '../../../utils.js';
import { createExplorerItem } from '../shared/dom.js';

export const topicEditorDom = {};

export function initTopicEditorDom() {
  Object.assign(topicEditorDom, {
    topicPicker: document.getElementById('editorTopicPicker'),
    topicId: document.getElementById('editorTopicId'),
    topicName: document.getElementById('editorTopicName'),
    topicDescription: document.getElementById('editorTopicDescription'),
    topicExamples: document.getElementById('editorTopicExamples'),
    saveTopicBtn: document.getElementById('saveTopicBtn'),
    createTopicBtn: document.getElementById('createTopicBtn'),
    topicSearch: document.getElementById('editorTopicSearch'),

    topicSelect: document.getElementById('editorTopicSelect'),
    topicList: document.getElementById('editorTopicList'),
    topicDialog: document.getElementById('editorTopicDialog'),
  });

  renderTopicPicker();
}

export function getClickedTopicId(event) {
  const item = event.target.closest('[data-topic-id]');
  return item ? item.dataset.topicId : '';
}

export function setTopicSelectedState(topicId) {
  setSelectedState(topicEditorDom.topicList, 'topicId', topicId);
}

export function renderTopicOptions() {
  topicEditorDom.topicList.innerHTML = '';
  const query = topicEditorDom.topicSearch.value.trim().toLowerCase();
  const topics = appState.topics.filter((topic) =>
    str(topic.topic_name).toLowerCase().includes(query),
  );

  if (!topics.length) {
    topicEditorDom.topicList.innerHTML = `
      <div class="decision-explorer__empty">
        ${appState.topics.length ? 'No topics match your search' : 'Load files first'}
      </div>
    `;
    return;
  }

  topics.forEach((topic) => {
    const item = createExplorerItem({
      id: topic.topic_id,
      title: topic.topic_name,
      meta: topic.description || '',
      type: 'topic',
      icon: '📁',
    });

    topicEditorDom.topicList.appendChild(item);
  });

  setTopicSelectedState(topicEditorDom.topicSelect.value);
}

export function renderTopicPicker() {
  topicEditorDom.topicPicker.innerHTML =
    '<option value="__new__">+ Create new topic</option>';

  appState.topics.forEach((topic) => {
    const option = document.createElement('option');
    option.value = str(topic.topic_id);
    option.textContent = `${topic.topic_name}`;
    topicEditorDom.topicPicker.appendChild(option);
  });
}

export function renderTopicFormFor(topicId) {
  const topic = topicId === '__new__' ? null : getTopic(topicId);

  topicEditorDom.topicId.value =
    topic?.topic_id || makeUniqueId('TOPIC', appState.topics, 'topic_id');

  topicEditorDom.topicName.value = topic?.topic_name || '';
  topicEditorDom.topicDescription.value = topic?.description || '';
  topicEditorDom.topicExamples.value = topic?.example_phrases || '';
}

function setSelectedState(container, datasetKey, selectedId) {
  const items = container.querySelectorAll('.decision-explorer__item');

  items.forEach((item) => {
    item.classList.toggle(
      'is-selected',
      item.dataset[datasetKey] === String(selectedId),
    );
  });
}
