import { getIssue, getIssuesForTopic, makeUniqueId, appState } from "../../../appState.js";
import { str } from "../../../utils.js";
import { createExplorerItem } from "../shared/dom.js";

export const issueEditorDom = {};

export function initIssueEditorDom() {
    Object.assign(issueEditorDom, {
        issuePicker: document.getElementById('editorIssuePicker'),
        issueId: document.getElementById('editorIssueId'),
        issueName: document.getElementById('editorIssueName'),
        issueDescription: document.getElementById('editorIssueDescription'),
        issueExamples: document.getElementById('editorIssueExamples'),
        saveIssueBtn: document.getElementById('saveIssueBtn'),
        createIssueBtn: document.getElementById('createIssueBtn'),

        issueSelect: document.getElementById("editorIssueSelect"),
        issueList: document.getElementById("editorIssueList"),
        issuePanelHint: document.getElementById("editorIssuePaneHint"),
        issueDialog: document.getElementById("editorIssueDialog"),
    });
}

export function setIssueSelectedState(issueId) {
  setSelectedState(issueEditorDom.issueList, "issueId", issueId);
}

export function renderIssueOptions(topicId) {
  const issues = topicId ? getIssuesForTopic(topicId) : [];

  issueEditorDom.issueSelect.value = "";
  issueEditorDom.issueList.innerHTML = "";

  if (!topicId) {
    issueEditorDom.issuePanelHint.textContent = "Select a topic first";
    issueEditorDom.issueList.innerHTML = `
      <div class="decision-explorer__empty">
        Select a topic first
      </div>  
    `;
    return;
  }
  
  issueEditorDom.issuePanelHint.textContent = "Create or double click on issue to edit";

  if (!issues.length) {
    issueEditorDom.issueList.innerHTML = `
      <div class="decision-explorer__empty">
        No issues found for this topic
      </div>
    `;
    return;
  }

  issues.forEach(issue => {
    const item = createExplorerItem({
      id: issue.issue_id,
      title: issue.issue_name,
      meta: issue.issue_description || "",
      type: "issue",
      icon: "📄",
    });

    issueEditorDom.issueList.appendChild(item);
  });
}

export function getClickedIssueId(event) {
  const item = event.target.closest("[data-issue-id]");
  return item ? item.dataset.issueId : "";
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

function setSelectedState(container, datasetKey, selectedId) {
  const items = container.querySelectorAll(".decision-explorer__item");

  items.forEach(item => {
    item.classList.toggle(
      "is-selected",
      item.dataset[datasetKey] === String(selectedId)
    );
  });
}
