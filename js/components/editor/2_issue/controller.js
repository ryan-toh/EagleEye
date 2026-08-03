import { getSelectedTopic } from '../1_topic/controller.js';
import { topicEditorDom } from '../1_topic/dom.js';
import { handleIssueSelection } from '../3_parameter/controller.js';
import {
  moveIssueToTopic,
  removeIssue,
  upsertIssue,
} from '../../../appState.js';
import {
  closeDialog,
  renderSelectedIssuePreview,
  setEditorStatus,
} from '../shared/controller.js';
import {
  issueEditorDom,
  initIssueEditorDom,
  renderIssueFormFor,
  renderIssueOptions,
  getClickedIssueId,
  setIssueSelectedState,
} from './dom.js';

export function initIssueEditor() {
  initIssueEditorDom();

  issueEditorDom.saveIssueBtn.addEventListener('click', onSaveIssue);
  issueEditorDom.createIssueBtn.addEventListener('click', onCreateIssue);
  issueEditorDom.issueSearch.addEventListener('input', () =>
    renderIssueOptions(getSelectedTopic()),
  );

  issueEditorDom.issueList.addEventListener('click', onIssueClick);
  issueEditorDom.issueList.addEventListener('dblclick', onIssueDblClick);
  issueEditorDom.issueList.addEventListener('dragstart', onIssueDragStart);
  issueEditorDom.issueList.addEventListener('dragend', clearDragState);

  topicEditorDom.topicList.addEventListener('dragover', onTopicDragOver);
  topicEditorDom.topicList.addEventListener('dragleave', onTopicDragLeave);
  topicEditorDom.topicList.addEventListener('drop', onTopicDrop);
}

async function onIssueClick(event) {
  const issueId = getClickedIssueId(event);

  if (!issueId) {
    return;
  }

  if (event.target.closest('.decision-explorer__delete')) {
    const topicId = getSelectedTopic();
    removeIssue(issueId);
    renderIssueOptions(topicId);
    setDomIssueValue('');
    handleIssueSelection('');
    await renderSelectedIssuePreview();
    setEditorStatus('Issue deleted. Download to save changes.', 'success');
    return;
  }

  selectIssue(issueId);
  handleIssueSelection(issueId);
  await renderSelectedIssuePreview();
}

function onIssueDblClick(event) {
  if (event.target.closest('.decision-explorer__delete')) return;

  const issueId = getClickedIssueId(event);

  if (!issueId) {
    return;
  }

  selectIssueForEditing(issueId);
  issueEditorDom.issueDialog.showModal();
}
export function setDomIssueValue(value) {
  issueEditorDom.issueSelect.value = value;
  setIssueSelectedState(value);
}

export function handleTopicSelection(topicId) {
  renderIssueOptions(topicId);
  clearIssueForm();
  setDomIssueValue('');
  handleIssueSelection('');
  void renderSelectedIssuePreview();
}

export function selectIssue(issueId) {
  setDomIssueValue(issueId);
}

export function setIssueOptions(topicId) {
  renderIssueOptions(topicId);
}

export function refreshIssue(topicId) {
  handleTopicSelection(topicId);
}

export function clearIssueForm() {
  renderIssueFormFor('__new__');
}

export function setIssueForm(issueId) {
  renderIssueFormFor(issueId);
}

async function onSaveIssue() {
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

    setEditorStatus('Saved issue. Download to see changes.', 'success');

    closeDialog(issueEditorDom.issueDialog);

    renderIssueOptions(topic_id);
    setDomIssueValue('');
    handleIssueSelection('');
    await renderSelectedIssuePreview();
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

export function getSelectedIssue() {
  return issueEditorDom.issueSelect.value;
}

function onCreateIssue() {
  if (!getSelectedTopic()) {
    setEditorStatus('Select a topic before creating an issue.', 'error');
    return;
  }

  selectIssueForEditing('__new__');
  issueEditorDom.issueDialog.showModal();
}

function selectIssueForEditing(issueId) {
  selectIssue(issueId);
  renderIssueFormFor(issueId);
}

function onIssueDragStart(event) {
  const issueId = getClickedIssueId(event);
  if (!issueId) return;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-eagle-eye-issue', issueId);
  event.target.closest('.decision-explorer__row')?.classList.add('is-dragging');
}

function onTopicDragOver(event) {
  const target = event.target.closest('[data-topic-id]');
  if (!target || !hasDragType(event, 'issue')) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  topicEditorDom.topicList
    .querySelectorAll('.is-drop-target')
    .forEach((row) => row.classList.remove('is-drop-target'));
  target.closest('.decision-explorer__row')?.classList.add('is-drop-target');
}

function onTopicDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  clearDragState();
}

function onTopicDrop(event) {
  const target = event.target.closest('[data-topic-id]');
  const draggedIssueId = event.dataTransfer.getData(
    'application/x-eagle-eye-issue',
  );
  clearDragState();
  if (!target || !draggedIssueId) return;

  event.preventDefault();
  try {
    const movedIssue = moveIssueToTopic(draggedIssueId, target.dataset.topicId);
    handleTopicSelection(getSelectedTopic());
    setEditorStatus(
      `Moved ${movedIssue.issue_name}. Download to save changes.`,
      'success',
    );
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function hasDragType(event, type) {
  return (
    type === 'issue' &&
    event.dataTransfer.types.includes('application/x-eagle-eye-issue')
  );
}

function clearDragState() {
  document
    .querySelectorAll(
      '.decision-explorer__row.is-dragging, .decision-explorer__row.is-drop-target',
    )
    .forEach((row) => row.classList.remove('is-dragging', 'is-drop-target'));
}
