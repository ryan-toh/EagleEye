import { appState } from '../appState.js';
import { serializeDraft } from './draftSerializer.js';
import { saveDraft } from './draftStore.js';

const AUTO_SAVE_DELAY = 500;
let sourceFile = null;
let sourceFileName = '';
let saveTimer = null;

export function initDraftAutoSave() {
  document.addEventListener('eagle-eye:data-changed', scheduleDraftSave);
}

export function setDraftSourceFile(file, filename = '') {
  sourceFile = file || null;
  sourceFileName = file?.name || filename;
}

export function scheduleDraftSave() {
  if (!sourceFile) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void saveCurrentDraft().catch(error => console.warn('Could not save local draft:', error));
  }, AUTO_SAVE_DELAY);
}

export async function saveCurrentDraft() {
  if (!sourceFile) return;
  await saveDraft(serializeDraft(appState, sourceFile, sourceFileName));
}
