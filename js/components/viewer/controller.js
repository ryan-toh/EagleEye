import { initViewerDomElements, viewerDom, renderIssueOptions } from "./dom.js";
import { setSelectedIssue, setSelectedTopic } from "../../state.js";
import { buildIssueFlowchart, renderMermaid } from "../../flowchart.js";
import { clearIssueView, previewDom, renderIssueSummary } from "../preview/dom.js";

export function initViewer() {
    initViewerDomElements();

    viewerDom.topicSelect.addEventListener('change', onTopicChange);
    viewerDom.issueSelect.addEventListener('change', onIssueChange);
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
}


