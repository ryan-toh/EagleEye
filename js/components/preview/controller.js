import { previewDom, initPreviewDomElements } from "./dom.js";

export function initPreview() {
    initPreviewDomElements();

    previewDom.copyMermaidBtn.addEventListener('click', copyMermaid);
}

export async function copyMermaid() {
  if (!appState.lastMermaid) return;

  await navigator.clipboard.writeText(appState.lastMermaid);
  previewDom.copyMermaidBtn.textContent = 'Copied';
  setTimeout(() => (previewDom.copyMermaidBtn.textContent = 'Copy Mermaid'), 1200);
}