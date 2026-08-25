import { selectTopic } from '../editorCoordinator.js';
import {
  clearDialogError,
  closeDialog,
  confirmDeletion,
  showDialogError,
} from '../../../ui/dialog.js';
import { notify } from '../../../ui/notifications.js';
import {
  initTopicEditorDom,
  topicEditorDom,
  renderTopicFormFor,
  getClickedTopicId,
  setTopicSelectedState,
  renderTopicOptions,
} from './dom.js';
import { removeTopic, upsertTopic } from '../../../appState.js';

export function initTopicEditor() {
  initTopicEditorDom();

  topicEditorDom.saveTopicBtn.addEventListener('click', onSaveTopic);
  topicEditorDom.createTopicBtn.addEventListener('click', onCreateTopic);
  topicEditorDom.topicList.addEventListener('click', onTopicClick);
  topicEditorDom.topicList.addEventListener('dblclick', onTopicDblClick);
}

/** Shared Functions */

export function setTopicOptions() {
  renderTopicOptions();
}

export function clearTopicForm() {
  renderTopicFormFor('__new__');
}

/** Issue related functions */

export function getSelectedTopic() {
  return topicEditorDom.topicSelect.value;
}

/** Event Listener Functions */

export function onTopicClick(event) {
  const topicId = getClickedTopicId(event);

  if (!topicId) {
    return;
  }

  // deletion
  if (event.target.closest('.decision-explorer__delete')) {
    if (
      !confirmDeletion(
        'topic',
        'This also removes its issues, parameters, rules, and recommendations.',
      )
    ) {
      return;
    }
    removeTopic(topicId);
    renderTopicOptions();
    setDomTopicValue('');
    selectTopic('');
    notify('Topic deleted. Download to save changes.', 'success');

    return;
  }

  setDomTopicValue(topicId);
  selectTopic(topicId);
}

function onTopicDblClick(event) {
  // stop if the user intended to delete instead
  if (event.target.closest('.decision-explorer__delete')) return;

  const topicId = getClickedTopicId(event);

  if (!topicId) {
    return;
  }

  selectTopicForEditing(topicId);
  topicEditorDom.topicDialog.showModal();
}

function onSaveTopic() {
  try {
    const topic_id = topicEditorDom.topicId.value;

    upsertTopic({
      topic_id: topic_id,
      topic_name: topicEditorDom.topicName.value,
      description: topicEditorDom.topicDescription.value,
      example_phrases: topicEditorDom.topicExamples.value,
    });

    notify('Saved topic. Download to see changes.', 'success');

    closeDialog(topicEditorDom.topicDialog);

    renderTopicOptions();
    setDomTopicValue('');
    selectTopic('');
  } catch (error) {
    showDialogError(topicEditorDom.topicDialog, error.message);
  }
}

/** Internal Functions */

export function setDomTopicValue(value) {
  topicEditorDom.topicSelect.value = value;
  setTopicSelectedState(value);
}

function onCreateTopic() {
  selectTopicForEditing('__new__');
  topicEditorDom.topicDialog.showModal();
}

function selectTopicForEditing(topicId) {
  clearDialogError(topicEditorDom.topicDialog);
  setDomTopicValue(topicId === '__new__' ? '' : topicId);
  renderTopicFormFor(topicId);
}
