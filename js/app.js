import { buildIssueFlowchart, renderMermaid } from './flowchart.js';
import { validateLibraries } from './utils.js';
import { loadState, setSelectedIssue, setSelectedTopic, appState } from './state.js';
import { dom, initDomElements, clearIssueView, copyMermaid, renderIssueOptions, renderIssueSummary, renderTopicOptions } from './dom.js';
import { disableLoading, setStatus } from './components/upload/dom.js';
// import { setActiveStep } from './components/header/dom.js';
import { initEditor, refreshEditor } from './components/editor/controller.js';
import { initUpload } from './components/upload/controller.js';

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
    initDomElements();
    initUpload();
    initEditor();
  } catch (error) {
    disableLoading(error.message);
    return;
  }


  // attach event listeners to buttons
  // dom.loadBtn.addEventListener('click', onLoadFiles);
  dom.topicSelect.addEventListener('change', onTopicChange);
  dom.issueSelect.addEventListener('change', onIssueChange);
  dom.copyMermaidBtn.addEventListener('click', copyMermaid);
  // dom.saveSheetBtn.addEventListener('click', saveSheet);
}

// async function onLoadFiles() {
//   setStatus('Loading files...');

//   try {
//     const workbookData = await loadWorkbookData(getFileInput());
//     validateWorkbookData(workbookData);
//     loadState(workbookData);
//     renderTopicOptions();
//     setStatus('Files loaded successfully.', 'success');
//   } catch (error) {
//     console.error(error);
//     setStatus(error.message || 'Failed to load files.', 'error');
//   }
// }

// to increment the stepper in the header (not implemented)
// function onStepChange() {
//   setActiveStep(-1);
// }

function onTopicChange() {
  const topicId = dom.topicSelect.value;
  setSelectedTopic(topicId);
  renderIssueOptions(topicId);
  clearIssueView();
}

async function onIssueChange() {
  const issueId = dom.issueSelect.value;
  setSelectedIssue(issueId);

  if (!issueId) {
    clearIssueView();
    return;
  }

  renderIssueSummary(issueId);

  const graphDefinition = buildIssueFlowchart(issueId);
  const result = await renderMermaid(dom.flowchart, graphDefinition);
  dom.copyMermaidBtn.disabled = false;

  if (!result.ok) {
    setStatus('Files are loaded, but Mermaid could not render the selected issue.', 'error');
  }
}