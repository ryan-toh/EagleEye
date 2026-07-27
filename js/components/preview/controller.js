import {
  previewDom,
  initPreviewDomElements,
  renderIssueSummary,
  renderEmptyIssueView,
} from './dom.js';
import { renderMermaid } from '../../flowchart.js';
import { appState } from '../../appState.js';

export function initPreview() {
  initPreviewDomElements();

  previewDom.copyMermaidBtn.addEventListener('click', copyGraph);
}

export async function copyGraph() {
  if (!appState.lastMermaid) return;

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard access is unavailable.');
    }

    await navigator.clipboard.writeText(appState.lastMermaid);
    previewDom.copyMermaidBtn.textContent = 'Copied';
  } catch (error) {
    console.error('Could not copy Mermaid:', error);
    previewDom.copyMermaidBtn.textContent = 'Copy unavailable';
  }

  setTimeout(
    () => (previewDom.copyMermaidBtn.textContent = 'Copy Mermaid'),
    1200,
  );
}

export async function setGraph(graphDefinition) {
  previewDom.copyMermaidBtn.disabled = false;
  return renderMermaid(previewDom.flowchart, graphDefinition);
}

export function clearIssueView() {
  renderEmptyIssueView();
}

export function setIssueSummary(issueId) {
  renderIssueSummary(issueId);
}
