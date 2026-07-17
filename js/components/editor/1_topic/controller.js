import { refreshIssue, setDomIssueValue, setIssueOptions } from "../2_issue/controller.js";
import { refreshParam, setDomParamValue } from "../3_parameter/controller.js";
import { setEditorStatus, closeDialog } from "../shared/controller.js";
import { initTopicEditorDom, topicEditorDom, renderTopicFormFor, renderTopicPicker, getClickedTopicId, setTopicSelectedState, renderTopicOptions } from "./dom.js";
import { upsertTopic } from "../../../appState.js";
import { clearIssueView } from "../../preview/controller.js";
import { setParamOptions } from "../3_parameter/controller.js";

export function initTopicEditor() {
    initTopicEditorDom();

    topicEditorDom.topicPicker.addEventListener('change', onTopicPicked);
    topicEditorDom.saveTopicBtn.addEventListener('click', onSaveTopic);
    
    topicEditorDom.topicList.addEventListener('click', onTopicClick);
    topicEditorDom.topicList.addEventListener('dblclick', onTopicDblClick);
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

    // Automatically load issue after choosing a topic
    refreshIssue(topicId);
    refreshParam("");
}

export function onTopicClick(event) {
  const topicId = getClickedTopicId(event);

  if (!topicId) {
    setEditorStatus("invalid topic id.", "error");
    return;
  }

  setDomTopicValue(topicId);
  setDomIssueValue("");
  setDomParamValue("");

  setIssueOptions(topicId);
  clearIssueView();
}

function onTopicDblClick(event) {
  const topicId = getClickedTopicId(event);

  if (!topicId) {
    setEditorStatus("invalid topic id.", "error");
    return;
  }

  renderTopicFormFor(topicId);

  topicEditorDom.topicDialog.showModal();

  refreshIssue(topicId);
  refreshParam("");
}

export function setTopicOptions() {
  renderTopicOptions();
}

export function setDomTopicValue(value) {
  topicEditorDom.topicSelect.value = value;
  setTopicSelectedState(value);
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
    topicEditorDom.topicPicker.value = topic_id;
    setDomTopicValue(topic_id);

    setEditorStatus('Topic saved, refreshed data.', 'success');

    closeDialog(topicEditorDom.topicDialog);

    // temp
    renderTopicOptions();
    setIssueOptions("");
    setParamOptions("");
    
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}