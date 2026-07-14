import { refreshIssue } from "../2_issue/controller.js";
import { refreshParam } from "../3_parameter/controller.js";
import { setEditorStatus } from "../shared/controller.js";
import { initTopicEditorDom, topicEditorDom, renderTopicFormFor, renderTopicPicker } from "./dom.js";
import { upsertTopic } from "../../../appState.js";

export function initTopicEditor() {
    initTopicEditorDom();

    topicEditorDom.topicPicker.addEventListener('change', onTopicPicked);
    topicEditorDom.saveTopicBtn.addEventListener('click', onSaveTopic);
}

export function refreshTopicPicker() {
  renderTopicPicker();
}

export function refreshTopic() {
  refreshIssuePicker();
  clearTopicForm();
}

export function clearTopicForm() {
  renderTopicFormFor('__new__');
}

export function onTopicPicked() {
    const topicId = topicEditorDom.topicPicker.value;

    renderTopicFormFor(topicId);

    // Automatically load params after choosing a topic
    refreshIssue(topicId);
    refreshParam(topicId);
}

export function getSelectedTopic() {
    return topicEditorDom.topicPicker.value;
}

export function setTopicForm(topicId) {
    renderTopicFormFor(topicId);
}

function onSaveTopic() {
  try {
    const topic_id = topicEditorDom.topicId.value;

    const topic = upsertTopic({
      topic_id: topic_id,
      topic_name: topicEditorDom.topicName.value,
      description: topicEditorDom.topicDescription.value,
      example_phrases: topicEditorDom.topicExamples.value
    });

    refreshTopicPicker();

    // To restore state
    topicEditorDom.topicId.value = topic_id;

    setEditorStatus('Topic saved, refreshed data.', 'success');
    
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}