import { buildIssueFlowchart, renderMermaid } from './flowchart.js';
import { getFileInputs, loadWorkbookData, validateLibraries, validateWorkbookData } from './fileService.js';
import { loadState, setSelectedIssue, setSelectedTopic } from './state.js';
import { clearIssueView, copyMermaid, disableLoading, dom, renderIssueOptions, renderIssueSummary, renderTopicOptions, setStatus } from './dom.js';

const fileInputs = getFileInputs();

initApp();

/**
 * Start the application.
 * Ensures that the required third-party libraries are loaded
 */
function initApp() {
  try {
    validateLibraries();
    window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
  } catch (error) {
    disableLoading(error.message);
    return;
  }

  // attach event listeners to buttons
  dom.loadBtn.addEventListener('click', onLoadFiles);
  dom.topicSelect.addEventListener('change', onTopicChange);
  dom.issueSelect.addEventListener('change', onIssueChange);
  dom.copyMermaidBtn.addEventListener('click', copyMermaid);
}

async function onLoadFiles() {
  setStatus('Loading files...');

  try {
    const workbookData = await loadWorkbookData(fileInputs);
    validateWorkbookData(workbookData);
    loadState(workbookData);
    renderTopicOptions();
    setStatus('Files loaded successfully.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to load files.', 'error');
  }
}

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