import { initUploadDomElements, uploadDom, renderStatus, getFileInput } from "./dom.js";
import { saveWorkbookData, loadWorkbookData, validateWorkbookData } from "../../fileService.js";
import { loadState, appState, renderStep, saveToLocalState, loadLocalState } from "../../appState.js";
import { setEditorTopicOptions } from "../editor/shared/controller.js";

export function initUpload() {
    initUploadDomElements();

    uploadDom.loadBtn.addEventListener('click', onLoadFiles);
    uploadDom.loadLocalBtn.addEventListener('click', onLoadLocal);
    uploadDom.downloadSheetTemplateBtn.addEventListener('click', downloadSheetTemplate);
    
}

// called only if a cached version of appState exists in local storage
function onLoadLocal() {
  loadLocalState();

  setEditorTopicOptions();
  appState.step = 2;
  renderStep();

  setStatus('Previous Session loaded successfully.', 'success');
}

async function onLoadFiles() {
  setStatus('Loading files...');

  try {
    const workbookData = await loadWorkbookData(getFileInput());
    validateWorkbookData(workbookData);
    loadState(workbookData);
    setEditorTopicOptions();
    setStatus('Files loaded successfully.', 'success');
    saveToLocalState();

    appState.step = 2;
    renderStep();

  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to load files.', 'error');
  }
}

export async function downloadSheetTemplate() {
  await saveWorkbookData(appState);
}

export function setStatus(message, type = '') {
  renderStatus(message, type);
}


