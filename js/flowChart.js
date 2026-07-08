import { appState } from './state.js';
import { isRequired, safeMermaidLabel, str } from './utils.js';

export async function renderMermaid(targetElement, graphDefinition) {
  appState.lastMermaid = graphDefinition;
  targetElement.classList.remove('empty');
  targetElement.innerHTML = '<div class="mermaid"></div>';

  try {
    const { svg } = await window.mermaid.render(`tree-${Date.now()}`, graphDefinition);
    targetElement.querySelector('.mermaid').innerHTML = svg;
    return { ok: true };
  } catch (error) {
    console.error(error);
    targetElement.innerHTML = `<pre>${escapeGraph(graphDefinition)}</pre><p class="status error">Mermaid could not render this chart. The raw Mermaid definition is shown above.</p>`;
    return { ok: false, error };
  }
}

function escapeGraph(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}