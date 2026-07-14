import { appState, getTopic, makeUniqueId } from "../../../appState.js";
import { str } from "../../../utils.js";

export const topicEditorDom = {};

export function initTopicEditorDom() {
    Object.assign(topicEditorDom, {
        topicPicker: document.getElementById('editorTopicPicker'),
        topicId: document.getElementById('editorTopicId'),
        topicName: document.getElementById('editorTopicName'),
        topicDescription: document.getElementById('editorTopicDescription'),
        topicExamples: document.getElementById('editorTopicExamples'),
        saveTopicBtn: document.getElementById('saveTopicBtn'),
    });

    renderTopicPicker();
}

export function clearTopicForm() {
    topicEditorDom.topicId.value = makeUniqueId('TOPIC', appState.topics, 'topic_id');
    topicEditorDom.topicName.value = '';
    topicEditorDom.topicDescription.value = '';
    topicEditorDom.topicExamples.value = '';
}

export function renderTopicPicker() {
  topicEditorDom.topicPicker.innerHTML = '<option value="__new__">+ Create new topic</option>';

  appState.topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = str(topic.topic_id);
    option.textContent = `${topic.topic_name}`;
    topicEditorDom.topicPicker.appendChild(option);
  });
}

export function renderTopicFormFor(topicId) {
  const topic = topicId === '__new__' ? null : getTopic(topicId);

  topicEditorDom.topicId.value = topic?.topic_id || makeUniqueId('TOPIC', appState.topics, 'topic_id');

  topicEditorDom.topicName.value = topic?.topic_name || '';
  topicEditorDom.topicDescription.value = topic?.description || '';
  topicEditorDom.topicExamples.value = topic?.example_phrases || '';
}

