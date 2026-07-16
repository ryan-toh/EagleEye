import { appState, getTopic, makeUniqueId } from "../../../appState.js";
import { str } from "../../../utils.js";
import { viewerDom } from "../../viewer/dom.js";
import { setIssueOptions } from "../2_issue/controller.js";

export const topicEditorDom = {};

export function initTopicEditorDom() {
    Object.assign(topicEditorDom, {
        topicPicker: document.getElementById('editorTopicPicker'),
        topicId: document.getElementById('editorTopicId'),
        topicName: document.getElementById('editorTopicName'),
        topicDescription: document.getElementById('editorTopicDescription'),
        topicExamples: document.getElementById('editorTopicExamples'),
        saveTopicBtn: document.getElementById('saveTopicBtn'),

        topicSelect: document.getElementById("editorTopicSelect"),
        topicList: document.getElementById("editorTopicList")

    });

    renderTopicPicker();
}

export function getClickedTopicId(event) {
  const item = event.target.closest("[data-topic-id]");
  return item ? item.dataset.topicId: "";
}

export function setTopicSelectedState(topicId) {
  setSelectedState(topicEditorDom.topicList, "topicId", topicId);
}

export function renderTopicOptions() {
  topicEditorDom.topicSelect.value = "";
  topicEditorDom.topicList.innerHTML = "";

  if (!appState.topics.length) {
    topicEditorDom.topicList.innerHTML = `
      <div class="decision-explorer__empty">
        Load files first
      </div>
    `;
    setIssueOptions("");
    return;
  }

  appState.topics.forEach(topic => {
    const item = createExplorerItem({
      id: topic.topic_id,
      title: topic.topic_name,
      meta: topic.description || "",
      type: "topic",
      icon: "📁"
    });

    topicEditorDom.topicList.appendChild(item)
  });

  setIssueOptions("");
}

export function renderTopicPicker() {
  topicEditorDom.topicPicker.innerHTML = '<option value="__new__">+ Create new topic</option>';

  appState.topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = str(topic.topic_id);
    option.textContent = `${topic.topic_name}`;
    topicEditorDom.topicPicker.appendChild(option);
  });
}

export function renderTopicFormFor(topicId) {
  const topic = topicId === '__new__' ? null : getTopic(topicId);

  topicEditorDom.topicId.value = topic?.topic_id || makeUniqueId('TOPIC', appState.topics, 'topic_id');

  topicEditorDom.topicName.value = topic?.topic_name || '';
  topicEditorDom.topicDescription.value = topic?.description || '';
  topicEditorDom.topicExamples.value = topic?.example_phrases || '';
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

  if (type === "param") {
    button.dataset.paramId = String(id);
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


