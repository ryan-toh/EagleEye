import {
  getIssue,
  getIssuesForTopic,
  makeUniqueId,
  appState,
} from '../../../appState.js';
import {
  getClickedExplorerId,
  renderExplorerEmpty,
  renderExplorerList,
  setExplorerSelectedState,
} from '../shared/explorerList.js';

export const issueEditorDom = {};

export function initIssueEditorDom() {
  Object.assign(issueEditorDom, {
    issueId: document.getElementById('editorIssueId'),
    issueName: document.getElementById('editorIssueName'),
    issueDescription: document.getElementById('editorIssueDescription'),
    issueExamples: document.getElementById('editorIssueExamples'),
    saveIssueBtn: document.getElementById('saveIssueBtn'),
    createIssueBtn: document.getElementById('createIssueBtn'),
    issueSelect: document.getElementById('editorIssueSelect'),
    issueList: document.getElementById('editorIssueList'),
    issuePanelHint: document.getElementById('editorIssuePaneHint'),
    issueDialog: document.getElementById('editorIssueDialog'),
  });
}

/** Controller Functions */

export function setIssueSelectedState(issueId) {
  setExplorerSelectedState(issueEditorDom.issueList, 'issueId', issueId);
}

export function renderIssueOptions(topicId) {
  const issues = topicId ? getIssuesForTopic(topicId) : [];

  if (!topicId) {
    issueEditorDom.issuePanelHint.textContent = 'Select a topic first';
    renderExplorerEmpty(issueEditorDom.issueList, 'Select a topic first');
    return;
  }

  issueEditorDom.issuePanelHint.textContent =
    'Create or double click on issue to edit';

  renderExplorerList({
    container: issueEditorDom.issueList,
    items: issues,
    query: '',
    selectedId: issueEditorDom.issueSelect.value,
    datasetKey: 'issueId',
    getId: (issue) => issue.issue_id,
    getTitle: (issue) => issue.issue_name,
    getMeta: (issue) => issue.issue_description || '',
    type: 'issue',
    icon: '📄',
    emptyMessage: (allIssues) =>
      allIssues.length
        ? 'No issues match your search'
        : 'No issues found for this topic',
  });
}

export function getClickedIssueId(event) {
  return getClickedExplorerId(event, 'issueId');
}

export function renderIssueFormFor(issueId) {
  const issue = issueId === '__new__' ? null : getIssue(issueId);

  issueEditorDom.issueId.value =
    issue?.issue_id || makeUniqueId('ISSUE', appState.issues, 'issue_id');
  issueEditorDom.issueName.value = issue?.issue_name || '';
  issueEditorDom.issueDescription.value = issue?.issue_description || '';
  issueEditorDom.issueExamples.value = issue?.example_phrases || '';
}
