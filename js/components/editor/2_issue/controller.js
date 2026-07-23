import { getSelectedTopic } from "../1_topic/controller.js";
import { handleIssueSelection } from "../3_parameter/controller.js";
import { removeIssue, upsertIssue } from "../../../appState.js";
import { closeDialog, renderSelectedIssuePreview, setEditorStatus } from "../shared/controller.js";
import { issueEditorDom, initIssueEditorDom, renderIssueFormFor, renderIssuePickerFor, renderIssueOptions, getClickedIssueId, setIssueSelectedState } from "./dom.js";

export function initIssueEditor() {
    initIssueEditorDom();

    issueEditorDom.issuePicker.addEventListener('change', onIssuePicked);
    issueEditorDom.saveIssueBtn.addEventListener('click', onSaveIssue);
    issueEditorDom.createIssueBtn.addEventListener('click', onCreateIssue);
    issueEditorDom.issueSearch.addEventListener('input', () => renderIssueOptions(getSelectedTopic()));

    issueEditorDom.issueList.addEventListener('click', onIssueClick);
    issueEditorDom.issueList.addEventListener('dblclick', onIssueDblClick);
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
    refreshIssuePicker(topicId);
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
  renderIssuePickerFor(topicId);
  clearIssueForm();
  setDomIssueValue('');
  handleIssueSelection('');
  void renderSelectedIssuePreview();
}

export function selectIssue(issueId) {
  issueEditorDom.issuePicker.value = issueId;
  setDomIssueValue(issueId);
}

export function setIssueOptions(topicId) {
  renderIssueOptions(topicId);
}

export function refreshIssue(topicId) {
  handleTopicSelection(topicId);
}

export function refreshIssuePicker(topicId) {
    renderIssuePickerFor(topicId);
}

export function clearIssueForm() {
  renderIssueFormFor('__new__');
}

export async function onIssuePicked() {
  const issueId = issueEditorDom.issuePicker.value;

  renderIssueFormFor(issueId);

  setDomIssueValue(issueId === '__new__' ? '' : issueId);
  handleIssueSelection(issueId === '__new__' ? '' : issueId);

  // Automatically load graph, token required 
  await renderSelectedIssuePreview();
}

export function setIssueForm(issueId) {
    renderIssueFormFor(issueId);
}

async function onSaveIssue() {
  try {
    const topic_id = getSelectedTopic();
    const issue_id = issueEditorDom.issueId.value;

    const issue = upsertIssue({
      issue_id: issue_id,
      topic_id: topic_id,
      issue_name: issueEditorDom.issueName.value,
      issue_description: issueEditorDom.issueDescription.value,
      example_phrases: issueEditorDom.issueExamples.value
    });

    refreshIssuePicker(topic_id);

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
  if (issueEditorDom.issuePicker.disabled) {
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
