import { initViewerDomElements, viewerDom, renderIssueOptions } from "./dom.js";
import { appState, setSelectedIssue, setSelectedTopic, renderStep } from "../../state.js";
import { buildIssueFlowchart, renderMermaid } from "../../flowchart.js";
import { clearIssueView, previewDom, renderIssueSummary } from "../preview/dom.js";

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

function onTopicChange() {
  const topicId = viewerDom.topicSelect.value;
  setSelectedTopic(topicId);
  renderIssueOptions(topicId);
  clearIssueView();
}

async function onIssueChange() {
  const issueId = viewerDom.issueSelect.value;
  setSelectedIssue(issueId);

  if (!issueId) {
    clearIssueView();
    return;
  }

  renderIssueSummary(issueId);

  const graphDefinition = buildIssueFlowchart(issueId);
  const result = await renderMermaid(previewDom.flowchart, graphDefinition);
  previewDom.copyMermaidBtn.disabled = false;

  if (!result.ok) {
    setStatus('Files are loaded, but Mermaid could not render the selected issue.', 'error');
  }
  
  appState.step = 3;
  renderStep();
}


