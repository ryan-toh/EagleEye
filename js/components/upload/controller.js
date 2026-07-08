import { initUploadDomElements, uploadDom, renderStatus, getFileInput } from "./dom.js";
import { saveWorkbookData, loadWorkbookData, validateWorkbookData } from "../../fileService.js";
import { loadState, appState, renderStep } from "../../state.js";
import { setTopicOptions } from "../viewer/controller.js";

export function initUpload() {
    initUploadDomElements();

    uploadDom.loadBtn.addEventListener('click', onLoadFiles);
    uploadDom.downloadSheetTemplateBtn.addEventListener('click', downloadSheetTemplate);
    
}

async function onLoadFiles() {
  setStatus('Loading files...');

  try {
    const workbookData = await loadWorkbookData(getFileInput());
    validateWorkbookData(workbookData);
    loadState(workbookData);
    setTopicOptions();
    setStatus('Files loaded successfully.', 'success');

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

export function setStatus(message) {
  renderStatus(message);
}


