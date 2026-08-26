import {
  previewDom,
  initPreviewDomElements,
  renderQuestionSummary,
  renderEmptyQuestionView,
} from './dom.js';
import { renderMermaid } from './mermaidRenderer.js';
import { getLastMermaid, setLastMermaid } from '../../ui/uiState.js';
import { createLatestRequestGate } from './latestRequest.js';

const graphRenderRequests = createLatestRequestGate();

export function initPreview() {
  initPreviewDomElements();

  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    flowchart: { useMaxWidth: false, wrappingWidth: 100 },
    themeVariables: { fontSize: '14px' },
  });

  previewDom.copyMermaidBtn.addEventListener('click', copyGraph);
  previewDom.fullscreenFlowchartBtn.addEventListener(
    'click',
    toggleFlowchartFullscreen,
  );
  document.addEventListener('fullscreenchange', syncFullscreenUi);
}

export async function copyGraph() {
  const graphDefinition = getLastMermaid();
  if (!graphDefinition) return;

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard access is unavailable.');
    }

    await navigator.clipboard.writeText(graphDefinition);
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
  const isCurrentRequest = graphRenderRequests.begin();
  setLastMermaid(graphDefinition);
  previewDom.copyMermaidBtn.disabled = false;
  return renderMermaid(previewDom.flowchart, graphDefinition, isCurrentRequest);
}

export function clearQuestionView() {
  graphRenderRequests.invalidate();
  renderEmptyQuestionView();
}

export function setQuestionSummary(preview) {
  renderQuestionSummary(preview);
}

async function toggleFlowchartFullscreen() {
  try {
    if (document.fullscreenElement === previewDom.flowchartPanel) {
      await document.exitFullscreen();
      return;
    }

    await previewDom.flowchartPanel.requestFullscreen();
  } catch (error) {
    console.error('Could not enter fullscreen mode:', error);
  }
}

function syncFullscreenUi() {
  const isFullscreen = document.fullscreenElement === previewDom.flowchartPanel;
  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  previewDom.fullscreenFlowchartBtn.innerHTML = isFullscreen
    ? '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></svg>'
    : '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>';
  previewDom.fullscreenFlowchartBtn.setAttribute('aria-label', label);
  previewDom.fullscreenFlowchartBtn.setAttribute('title', label);
  previewDom.fullscreenFlowchartBtn.setAttribute(
    'aria-pressed',
    String(isFullscreen),
  );
}
