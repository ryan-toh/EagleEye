import { buildIssueFlowchart, renderMermaid } from './flowchart.js';
import { validateLibraries } from './utils.js';
import { disableLoading, setStatus } from './components/upload/dom.js';
import { initEditor } from './components/editor/controller.js';
import { initUpload } from './components/upload/controller.js';
import { initViewer } from './components/viewer/controller.js';
import { initPreview } from './components/preview/controller.js';

document.addEventListener("DOMContentLoaded", main);

async function main() {
  try {
    await loadParts();
    initApp();

  } catch (error) {
    console.error("Failed to initialise app:", error);
  }
}


// Load HTML parts
async function loadParts() {
  const includeElements = document.querySelectorAll("[data-include]");

  for (const element of includeElements) {
    const filePath = element.getAttribute("data-include");
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Failed to load partial: ${filePath}`);
    }
    
    element.innerHTML = await response.text();

  }
}

/**
 * Start the application.
 * Ensures that the required third-party libraries are loaded
 */
function initApp() {
  try {
    validateLibraries();

    window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

    initUpload();
    initEditor();
    initViewer();
    initPreview();

  } catch (error) {
    disableLoading(error.message);
    return;
  }
}