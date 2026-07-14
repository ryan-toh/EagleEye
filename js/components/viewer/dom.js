import { appState, getIssuesForTopic } from "../../appState.js";

export const viewerDom = {};

export function initViewerDomElements() {
  Object.assign(viewerDom, {
    topicSelect: document.getElementById("topicSelect"),
    issueSelect: document.getElementById("issueSelect"),
    topicList: document.getElementById("topicList"),
    issueList: document.getElementById("issueList"),
    issuePaneHint: document.getElementById("issuePaneHint"),
  });

  return viewerDom;
}

export function renderTopicOptions() {
  viewerDom.topicSelect.value = "";
  viewerDom.issueSelect.value = "";
  viewerDom.topicList.innerHTML = "";

  if (!appState.topics.length) {
    viewerDom.topicList.innerHTML = `
      <div class="decision-explorer__empty">
        Load files first
      </div>
    `;
    renderIssueOptions("");
    return;
  }

  appState.topics.forEach(topic => {
    const item = createExplorerItem({
      id: topic.topic_id,
      title: topic.topic_name,
      meta: topic.description || "",
      type: "topic",
      icon: "📁",
    });

    viewerDom.topicList.appendChild(item);
  });

  renderIssueOptions("");
}

export function renderIssueOptions(topicId) {
  const issues = topicId ? getIssuesForTopic(topicId) : [];

  viewerDom.issueSelect.value = "";
  viewerDom.issueList.innerHTML = "";

  if (!topicId) {
    viewerDom.issuePaneHint.textContent = "Select a topic first";
    viewerDom.issueList.innerHTML = `
      <div class="decision-explorer__empty">
        Select a topic first
      </div>
    `;
    return;
  }

  viewerDom.issuePaneHint.textContent = "Choose an issue";

  if (!issues.length) {
    viewerDom.issueList.innerHTML = `
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

    viewerDom.issueList.appendChild(item);
  });
}

export function getClickedTopicId(event) {
  const item = event.target.closest("[data-topic-id]");
  return item ? item.dataset.topicId : "";
}

export function getClickedIssueId(event) {
  const item = event.target.closest("[data-issue-id]");
  return item ? item.dataset.issueId : "";
}

export function setTopicSelectedState(topicId) {
  setSelectedState(viewerDom.topicList, "topicId", topicId);
}

export function setIssueSelectedState(issueId) {
  setSelectedState(viewerDom.issueList, "issueId", issueId);
}

function createExplorerItem({ id, title, meta, type, icon }) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "decision-explorer__item";

  if (type === "topic") {
    button.dataset.topicId = String(id);
  }

  if (type === "issue") {
    button.dataset.issueId = String(id);
  }

  button.innerHTML = `
    <span class="decision-explorer__item-icon" aria-hidden="true">
      ${icon}
    </span>
    <span class="decision-explorer__item-main">
      <span class="decision-explorer__item-title"></span>
      ${
        meta
          ? '<span class="decision-explorer__item-meta"></span>'
          : ""
      }
    </span>
  `;

  button.querySelector(".decision-explorer__item-title").textContent = title;

  const metaElement = button.querySelector(".decision-explorer__item-meta");

  if (metaElement) {
    metaElement.textContent = meta;
  }

  return button;
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