import { appState, getTopic, makeUniqueId } from '../../../appState.js';
import {
  getClickedExplorerId,
  renderExplorerList,
  setExplorerSelectedState,
} from '../shared/explorerList.js';

export const topicEditorDom = {};

export function initTopicEditorDom() {
  Object.assign(topicEditorDom, {
    topicId: document.getElementById('editorTopicId'),
    topicName: document.getElementById('editorTopicName'),
    topicDescription: document.getElementById('editorTopicDescription'),
    topicExamples: document.getElementById('editorTopicExamples'),
    saveTopicBtn: document.getElementById('saveTopicBtn'),
    createTopicBtn: document.getElementById('createTopicBtn'),
    topicSelect: document.getElementById('editorTopicSelect'),
    topicList: document.getElementById('editorTopicList'),
    topicDialog: document.getElementById('editorTopicDialog'),
  });
}

/** Controller Functions */

export function getClickedTopicId(event) {
  return getClickedExplorerId(event, 'topicId');
}

export function setTopicSelectedState(topicId) {
  setExplorerSelectedState(topicEditorDom.topicList, 'topicId', topicId);
}

export function renderTopicOptions() {
  renderExplorerList({
    container: topicEditorDom.topicList,
    items: appState.topics,
    query: '',
    selectedId: topicEditorDom.topicSelect.value,
    datasetKey: 'topicId',
    getId: (topic) => topic.topic_id,
    getTitle: (topic) => topic.topic_name,
    getMeta: (topic) => topic.description || '',
    type: 'topic',
    icon: '📁',
    emptyMessage: (topics) =>
      topics.length ? 'No topics match your search' : 'Load files first',
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
