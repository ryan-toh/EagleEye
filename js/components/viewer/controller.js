import { initViewerDomElements, viewerDom, renderIssueOptions, renderTopicOptions } from "./dom.js";
import { appState, renderStep } from "../../state.js";
import { renderMermaid } from "../../flowchart.js";
import { clearIssueView, setIssueSummary, setGraph } from "../preview/controller.js";
import { onTopicPicked } from "../editor/topic/controller.js";
import { buildIssueFlowchart } from "../preview/flowchart.js";

export function initViewer() {
    initViewerDomElements();

    viewerDom.topicSelect.addEventListener('change', onTopicChange);
    viewerDom.issueSelect.addEventListener('change', onIssueChange);
}

export function getDomTopicValue() {
  return viewerDom.topicSelect.value;
}

export function setDomTopicValue(value) {
  viewerDom.topicSelect.value = value;
}

export function getDomIssueValue(value) {
  return viewerDom.issueSelect.value;
}

export function setDomIssueValue(value) {
  viewerDom.issueSelect.value = value;
}

export function setTopicOptions() {
  renderTopicOptions();
}

export function setIssueOptions(topic_id) {
  renderIssueOptions(topic_id);
}

export function onTopicChange() {
  const topicId = viewerDom.topicSelect.value;

  // exception: temporary link between viewer and editor
  // editorDom.topicPicker.value = topicId;
  // onTopicPicked();

  // setSelectedTopic(topicId);
  renderIssueOptions(topicId);
  clearIssueView();
}

async function onIssueChange() {
  const issueId = viewerDom.issueSelect.value;
  // setSelectedIssue(issueId);

  if (!issueId) {
    clearIssueView();
    return;
  }

  setIssueSummary(issueId);

  const graphDefinition = buildIssueFlowchart(issueId);
  const result = await setGraph(graphDefinition);
  // const result = await renderMermaid(previewDom.flowchart, graphDefinition);
  // previewDom.copyMermaidBtn.disabled = false;

  if (!result.ok) {
    setStatus('Files are loaded, but Mermaid could not render the selected issue.', 'error');
  }
  
  appState.step = 3;
  renderStep();
}


