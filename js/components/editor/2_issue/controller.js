import { getSelectedTopic } from '../1_topic/controller.js';
import { topicEditorDom } from '../1_topic/dom.js';
import {
  selectIssue as publishIssueSelection,
  requestIssuePreviewRefresh,
  subscribeToTopicSelection,
} from '../editorCoordinator.js';
import {
  moveIssueToTopic,
  removeIssue,
  upsertIssue,
} from '../../../appState.js';
import {
  clearDialogError,
  closeDialog,
  confirmDeletion,
  showDialogError,
} from '../../../ui/dialog.js';
import { notify } from '../../../ui/notifications.js';
import {
  issueEditorDom,
  initIssueEditorDom,
  renderIssueFormFor,
  renderIssueOptions,
  getClickedIssueId,
  setIssueSelectedState,
} from './dom.js';
import {
  clearExplorerDragState,
  getExplorerDragId,
  markExplorerDropTarget,
  startExplorerDrag,
  supportsExplorerDrag,
} from '../shared/explorerDragDrop.js';

const ISSUE_DRAG_TYPE = 'application/x-eagle-eye-issue';

export function initIssueEditor() {
  initIssueEditorDom();

  issueEditorDom.saveIssueBtn.addEventListener('click', onSaveIssue);
  issueEditorDom.createIssueBtn.addEventListener('click', onCreateIssue);
  issueEditorDom.issueList.addEventListener('click', onIssueClick);
  issueEditorDom.issueList.addEventListener('dblclick', onIssueDblClick);
  issueEditorDom.issueList.addEventListener('dragstart', onIssueDragStart);
  issueEditorDom.issueList.addEventListener('dragend', clearExplorerDragState);

  topicEditorDom.topicList.addEventListener('dragover', onTopicDragOver);
  topicEditorDom.topicList.addEventListener('dragleave', onTopicDragLeave);
  topicEditorDom.topicList.addEventListener('drop', onTopicDrop);
  subscribeToTopicSelection(handleTopicSelection);
}

/** Event Listener Functions */

function onIssueClick(event) {
  const issueId = getClickedIssueId(event);

  if (!issueId) {
    return;
  }

  // deletion
  if (event.target.closest('.decision-explorer__delete')) {
    if (
      !confirmDeletion(
        'issue',
        'This also removes its parameters, rules, and recommendations.',
      )
    ) {
      return;
    }
    const topicId = getSelectedTopic();
    removeIssue(issueId);
    renderIssueOptions(topicId);
    setDomIssueValue('');
    publishIssueSelection('');
    requestIssuePreviewRefresh();
    notify('Issue deleted. Download to save changes.', 'success');
    return;
  }

  selectIssue(issueId);
  publishIssueSelection(issueId);
  requestIssuePreviewRefresh();
}

function onIssueDblClick(event) {
  // stop if the user intended to delete instead
  if (event.target.closest('.decision-explorer__delete')) return;

  const issueId = getClickedIssueId(event);

  if (!issueId) {
    return;
  }

  selectIssueForEditing(issueId);
  issueEditorDom.issueDialog.showModal();
}

/** Shared Functions */

export function setDomIssueValue(value) {
  issueEditorDom.issueSelect.value = value;
  setIssueSelectedState(value);
}

function handleTopicSelection(topicId) {
  renderIssueOptions(topicId);
  clearIssueForm();
  setDomIssueValue('');
  publishIssueSelection('');
  requestIssuePreviewRefresh();
}

export function selectIssue(issueId) {
  setDomIssueValue(issueId);
}

export function clearIssueForm() {
  renderIssueFormFor('__new__');
}

/** Internal Functions */

function onSaveIssue() {
  try {
    const topic_id = getSelectedTopic();
    const issue_id = issueEditorDom.issueId.value;

    upsertIssue({
      issue_id: issue_id,
      topic_id: topic_id,
      issue_name: issueEditorDom.issueName.value,
      issue_description: issueEditorDom.issueDescription.value,
      example_phrases: issueEditorDom.issueExamples.value,
    });

    notify('Saved issue. Download to see changes.', 'success');

    closeDialog(issueEditorDom.issueDialog);

    renderIssueOptions(topic_id);
    setDomIssueValue('');
    publishIssueSelection('');
    requestIssuePreviewRefresh();
  } catch (error) {
    showDialogError(issueEditorDom.issueDialog, error.message);
  }
}

/** Parameter related functions */

export function getSelectedIssue() {
  return issueEditorDom.issueSelect.value;
}

function onCreateIssue() {
  if (!getSelectedTopic()) {
    notify('Select a topic before creating an issue.', 'error');
    return;
  }

  selectIssueForEditing('__new__');
  issueEditorDom.issueDialog.showModal();
}

function selectIssueForEditing(issueId) {
  clearDialogError(issueEditorDom.issueDialog);
  selectIssue(issueId);
  renderIssueFormFor(issueId);
}

function onIssueDragStart(event) {
  startExplorerDrag(event, getClickedIssueId(event), ISSUE_DRAG_TYPE);
}

/** Drag and Drop Functions */

function onTopicDragOver(event) {
  const target = event.target.closest('[data-topic-id]');
  if (!target || !supportsExplorerDrag(event, ISSUE_DRAG_TYPE)) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  markExplorerDropTarget(topicEditorDom.topicList, target);
}

function onTopicDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  clearExplorerDragState();
}

function onTopicDrop(event) {
  const target = event.target.closest('[data-topic-id]');
  const draggedIssueId = getExplorerDragId(event, ISSUE_DRAG_TYPE);
  clearExplorerDragState();
  if (!target || !draggedIssueId) return;

  event.preventDefault();
  try {
    const movedIssue = moveIssueToTopic(draggedIssueId, target.dataset.topicId);
    handleTopicSelection(getSelectedTopic());
    notify(
      `Moved ${movedIssue.issue_name}. Download to save changes.`,
      'success',
    );
  } catch (error) {
    notify(error.message, 'error');
  }
}
