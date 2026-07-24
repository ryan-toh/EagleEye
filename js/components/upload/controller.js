import { initUploadDomElements, uploadDom, renderStatus, getFileInput } from "./dom.js";
import { saveWorkbookData, loadWorkbookData, validateWorkbookData } from "../../fileService.js";
import { loadState, appState, renderStep } from "../../appState.js";
import { setEditorTopicOptions } from "../editor/shared/controller.js";
import { discardLocalDraft } from '../../persistence/draftRecovery.js';
import { saveCurrentDraft, setDraftSourceFile } from '../../persistence/draftAutoSave.js';

export function initUpload() {
    initUploadDomElements();

    uploadDom.loadBtn.addEventListener('click', onLoadFiles);
    uploadDom.downloadSheetTemplateBtn.addEventListener('click', downloadSheetTemplate);
    uploadDom.discardLocalDraftBtn.addEventListener('click', onDiscardLocalDraft);
    
}

async function onLoadFiles() {
  setStatus('Loading files...');

  try {
    const file = getFileInput().files[0];
    const workbookData = await loadWorkbookData(getFileInput());
    validateWorkbookData(workbookData);
    loadState(workbookData);
    setDraftSourceFile(file);
    void saveCurrentDraft().catch(error => console.warn('Could not save local draft:', error));
    setEditorTopicOptions();
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

async function onDiscardLocalDraft() {
  try {
    await discardLocalDraft();
    setStatus('Discarded the local draft.', 'success');
  } catch (error) {
    setStatus(error.message || 'Could not discard the local draft.', 'error');
  }
}

export function setStatus(message, type = '') {
  renderStatus(message, type);
}


