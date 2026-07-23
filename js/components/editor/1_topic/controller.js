import { handleTopicSelection } from "../2_issue/controller.js";
import { setEditorStatus, closeDialog } from "../shared/controller.js";
import { initTopicEditorDom, topicEditorDom, renderTopicFormFor, renderTopicPicker, getClickedTopicId, setTopicSelectedState, renderTopicOptions } from "./dom.js";
import { removeTopic, upsertTopic } from "../../../appState.js";

export function initTopicEditor() {
    initTopicEditorDom();

    topicEditorDom.topicPicker.addEventListener('change', onTopicPicked);
    topicEditorDom.saveTopicBtn.addEventListener('click', onSaveTopic);
    topicEditorDom.createTopicBtn.addEventListener('click', onCreateTopic);
    topicEditorDom.topicSearch.addEventListener('input', renderTopicOptions);

    topicEditorDom.topicList.addEventListener('click', onTopicClick);
    topicEditorDom.topicList.addEventListener('dblclick', onTopicDblClick);
}

export function refreshTopicPicker() {
  renderTopicPicker();
}

export function refreshTopic() {
  clearTopicForm();
}

export function clearTopicForm() {
  renderTopicFormFor('__new__');
}

export function onTopicPicked() {
    const topicId = topicEditorDom.topicPicker.value;

    renderTopicFormFor(topicId);
    setDomTopicValue(topicId === '__new__' ? '' : topicId);
    handleTopicSelection(topicId === '__new__' ? '' : topicId);
}

export function onTopicClick(event) {
  const topicId = getClickedTopicId(event);

  if (!topicId) {
    return;
  }

  if (event.target.closest('.decision-explorer__delete')) {
    removeTopic(topicId);
    refreshTopicPicker();
    renderTopicOptions();
    setDomTopicValue('');
    handleTopicSelection('');
    setEditorStatus('Topic deleted. Download to save changes.', 'success');
    return;
  }

  setDomTopicValue(topicId);
  handleTopicSelection(topicId);
}

function onTopicDblClick(event) {
  if (event.target.closest('.decision-explorer__delete')) return;

  const topicId = getClickedTopicId(event);

  if (!topicId) {
    return;
  }

  selectTopicForEditing(topicId);
  topicEditorDom.topicDialog.showModal();
}

export function setTopicOptions() {
  renderTopicOptions();
}

export function setDomTopicValue(value) {
  topicEditorDom.topicSelect.value = value;
  topicEditorDom.topicPicker.value = value || '__new__';
  setTopicSelectedState(value);
}


export function getSelectedTopic() {
    return topicEditorDom.topicSelect.value;
}

export function setTopicForm(topicId) {
    renderTopicFormFor(topicId);
}

function onCreateTopic() {
  selectTopicForEditing('__new__');
  topicEditorDom.topicDialog.showModal();
}

function selectTopicForEditing(topicId) {
  setDomTopicValue(topicId === '__new__' ? '' : topicId);
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

    setEditorStatus('Saved topic. Download to see changes.', 'success');

    closeDialog(topicEditorDom.topicDialog);

    renderTopicOptions();
    setDomTopicValue('');
    handleTopicSelection('');
    
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}
