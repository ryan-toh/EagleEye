import {
  initUploadDomElements,
  uploadDom,
  renderStatus,
  getFileInput,
} from './dom.js';
import {
  saveWorkbookData,
  loadWorkbookData,
  validateWorkbookData,
} from '../../fileService.js';
import {
  loadState,
  getWorkbookData,
  saveToLocalState,
  loadLocalState,
} from '../../appState.js';
import { renderStep } from '../../ui/stepRenderer.js';
import { loadUiState, setStep, uiState } from '../../ui/uiState.js';
import { subscribeToNotifications } from '../../ui/notifications.js';
import { setEditorTopicOptions } from '../editor/shared/controller.js';

export function initUpload() {
  initUploadDomElements();
  subscribeToNotifications(({ message, type }) => setStatus(message, type));

  uploadDom.loadBtn.addEventListener('click', onLoadFiles);
  uploadDom.loadLocalBtn.addEventListener('click', onLoadLocal);
  uploadDom.downloadSheetTemplateBtn.addEventListener(
    'click',
    downloadSheetTemplate,
  );
}

// called only if a cached version of appState exists in local storage
function onLoadLocal() {
  try {
    loadLocalState();
    loadUiState();
    setEditorTopicOptions();
    setStep(2);
    renderStep(uiState.step);
    setStatus('Previous Session loaded successfully.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to load the previous session.', 'error');
  }
}

async function onLoadFiles() {
  setStatus('Loading files...');

  try {
    const workbookData = await loadWorkbookData(getFileInput());
    validateWorkbookData(workbookData);
    loadState(workbookData);
    setEditorTopicOptions();
    setStatus('Files loaded successfully.', 'success');
    setStep(2);
    saveToLocalState();
    renderStep(uiState.step);
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to load files.', 'error');
  }
}

export async function downloadSheetTemplate() {
  await saveWorkbookData(getWorkbookData());
}

export function setStatus(message, type = '') {
  renderStatus(message, type);
}
