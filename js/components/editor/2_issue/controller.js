import { getSelectedTopic } from "../1_topic/controller.js";
import { refreshParam } from "../3_parameter/controller.js";
import { upsertIssue, appState } from "../../../appState.js";
import { renderSelectedIssuePreview, setEditorStatus } from "../shared/controller.js";
import { issueEditorDom, initIssueEditorDom, renderIssueFormFor, renderIssuePickerFor } from "./dom.js";
import { buildIssueFlowchart } from "../../preview/flowchart.js";

export function initIssueEditor() {
    initIssueEditorDom();

    issueEditorDom.issuePicker.addEventListener('change', onIssuePicked);
    issueEditorDom.saveIssueBtn.addEventListener('click', onSaveIssue);
}

export function refreshIssue(topicId) {
  refreshIssuePicker(topicId);
  clearIssueForm();
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

  // Automatically load params after choosing an issue
  refreshParam(issueId);

  // Automatically load graph, token required 
  await renderSelectedIssuePreview();
}

export function setIssueForm(issueId) {
    renderIssueFormFor(issueId);
}

function onSaveIssue() {
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

    // To restore state
    issueEditorDom.issuePicker.value = issue_id

    setEditorStatus('Issue saved.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

export function getSelectedIssue() {
    return issueEditorDom.issuePicker.value;
}