import { previewDom, initPreviewDomElements, renderIssueSummary, renderEmptyIssueView } from "./dom.js";
import { renderMermaid } from "../../flowchart.js";
import { appState } from "../../state.js";

export function initPreview() {
    initPreviewDomElements();

    previewDom.copyMermaidBtn.addEventListener('click', copyGraph);
}

export async function copyGraph() {
  if (!appState.lastMermaid) return;

  await navigator.clipboard.writeText(appState.lastMermaid);
  previewDom.copyMermaidBtn.textContent = 'Copied';
  setTimeout(() => (previewDom.copyMermaidBtn.textContent = 'Copy Mermaid'), 1200);
}

export function setGraph(graphDefinition) {
  previewDom.copyMermaidBtn.disabled = false;
  return renderMermaid(previewDom.flowchart, graphDefinition);
}

export function clearIssueView() {
  renderEmptyIssueView();
}

export function setIssueSummary(issueId) {
  renderIssueSummary(issueId);
}
