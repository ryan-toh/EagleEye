import {
  initViewerDomElements,
  viewerDom,
  renderIssueOptions,
  renderTopicOptions,
  getClickedTopicId,
  getClickedIssueId,
  setTopicSelectedState,
  setIssueSelectedState,
} from "./dom.js";

import { appState, renderStep } from "../../appState.js";
import { clearIssueView, setIssueSummary, setGraph } from "../preview/controller.js";
import { buildIssueFlowchart } from "../preview/flowchart.js";
import { setStatus } from "../upload/controller.js";

export function initViewer() {
  initViewerDomElements();

  viewerDom.topicList.addEventListener('click', onTopicClick);
  viewerDom.issueList.addEventListener('click', onIssueClick);
}

export function getDomTopicValue() {
  return viewerDom.topicSelect.value;
}

export function setDomTopicValue(value) {
  viewerDom.topicSelect.value = value;
  setTopicSelectedState(value);
}

export function getDomIssueValue() {
  return viewerDom.issueSelect.value;
}

export function setDomIssueValue(value) {
  viewerDom.issueSelect.value = value;
  setIssueSelectedState(value);
}

export function setViewerTopicOptions() {
  renderTopicOptions();
  clearIssueView();
}

export function setIssueOptions(topicId) {
  renderIssueOptions(topicId);
}

function onTopicClick(event) {
  const topicId = getClickedTopicId(event);

  if (!topicId) {
    return;
  }

  setDomTopicValue(topicId);
  setDomIssueValue("");

  renderIssueOptions(topicId);
  clearIssueView();
}

async function onIssueClick(event) {
  const issueId = getClickedIssueId(event);

  if (!issueId) {
    return;
  }

  setDomIssueValue(issueId);
  await renderSelectedIssue(issueId);
}

async function renderSelectedIssue(issueId) {
  if (!issueId) {
    clearIssueView();
    return;
  }

  setIssueSummary(issueId);

  const graphDefinition = buildIssueFlowchart(issueId);
  const result = await setGraph(graphDefinition);

  if (!result.ok) {
    setStatus(
      "Files are loaded, but Mermaid could not render the selected issue.",
      "error"
    );
  }

  appState.step = 3;
  renderStep();
}