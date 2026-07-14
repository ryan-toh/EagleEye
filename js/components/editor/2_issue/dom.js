import { getIssue, getIssuesForTopic, makeUniqueId, appState } from "../../../appState.js";
import { str } from "../../../utils.js";

export const issueEditorDom = {};

export function initIssueEditorDom() {
    Object.assign(issueEditorDom, {
        issuePicker: document.getElementById('editorIssuePicker'),
        issueId: document.getElementById('editorIssueId'),
        issueName: document.getElementById('editorIssueName'),
        issueDescription: document.getElementById('editorIssueDescription'),
        issueExamples: document.getElementById('editorIssueExamples'),
        saveIssueBtn: document.getElementById('saveIssueBtn'),
    });
}

export function renderIssuePickerFor(topicId) {
  issueEditorDom.issuePicker.innerHTML = '<option value="__new__">+ Create new issue</option>';

  if (topicId) {
    getIssuesForTopic(topicId).forEach(issue => {
      const option = document.createElement('option');
      option.value = str(issue.issue_id);
      option.textContent = `${issue.issue_name}`;
      issueEditorDom.issuePicker.appendChild(option);
    });
  }

  issueEditorDom.issuePicker.disabled = !topicId;
  issueEditorDom.issuePicker.value = '__new__';
}

export function renderIssueFormFor(issueId) {
  const issue = issueId === '__new__' ? null : getIssue(issueId);

  issueEditorDom.issueId.value = issue?.issue_id || makeUniqueId('ISSUE', appState.issues, 'issue_id');
  issueEditorDom.issueName.value = issue?.issue_name || '';
  issueEditorDom.issueDescription.value = issue?.issue_description || '';
  issueEditorDom.issueExamples.value = issue?.example_phrases || '';
}
