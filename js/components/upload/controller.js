import { initUploadDomElements, uploadDom, setStatus, getFileInput } from "./dom.js";
import { saveWorkbookData, loadWorkbookData, validateWorkbookData } from "./fileService.js";
import { loadState, appState, renderStep } from "../../state.js";
import { renderTopicOptions } from "../viewer/dom.js";

export function initUpload() {
    initUploadDomElements();

    uploadDom.loadBtn.addEventListener('click', onLoadFiles);
    uploadDom.saveSheetBtn.addEventListener('click', saveSheet);
    
}

async function onLoadFiles() {
  setStatus('Loading files...');

  try {
    const workbookData = await loadWorkbookData(getFileInput());
    validateWorkbookData(workbookData);
    loadState(workbookData);
    renderTopicOptions();
    setStatus('Files loaded successfully.', 'success');

    appState.step = 2;
    renderStep();

  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to load files.', 'error');
  }
}

export async function saveSheet() {
  await saveWorkbookData(appState);
}


