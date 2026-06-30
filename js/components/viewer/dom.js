import { appState, getIssuesForTopic } from "../../state.js";
import { renderTopicPicker } from "../editor/dom.js";
import { clearIssueView } from "../preview/dom.js";

export const viewerDom = {};

export function initViewerDomElements() {
    Object.assign(viewerDom, {
        topicSelect:         document.getElementById('topicSelect'),
        issueSelect:         document.getElementById('issueSelect'),
    })

    return viewerDom;
}

export function renderTopicOptions() {
  viewerDom.topicSelect.innerHTML = '<option value="">Select a topic</option>';

  appState.topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = String(topic.topic_id);
    option.textContent = `${topic.topic_name} (${topic.topic_id})`;
    viewerDom.topicSelect.appendChild(option);
  });

  viewerDom.topicSelect.disabled = false;
  renderIssueOptions('');
  renderTopicPicker();
  clearIssueView();
}

export function renderIssueOptions(topicId) {
  const issues = topicId ? getIssuesForTopic(topicId) : [];

  viewerDom.issueSelect.innerHTML = topicId
    ? '<option value="">Select an issue</option>'
    : '<option value="">Select a topic first</option>';

  issues.forEach(issue => {
    const option = document.createElement('option');
    option.value = String(issue.issue_id);
    option.textContent = `${issue.issue_name} (${issue.issue_id})`;
    viewerDom.issueSelect.appendChild(option);
  });

  viewerDom.issueSelect.disabled = !topicId;
}