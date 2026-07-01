import { previewDom, initPreviewDomElements, renderIssueSummary } from "./dom.js";
import { renderMermaid } from "../../flowChart.js";
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

export function displayGraph(graphDefinition) {
  renderMermaid(previewDom.flowchart, graphDefinition);
  previewDom.copyMermaidBtn.disabled = false;
}

export function displayIssueSummary(issueId) {
  renderIssueSummary(issueId);
}