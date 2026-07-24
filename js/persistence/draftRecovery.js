import { appState, loadState, renderStep } from '../appState.js';
import { setEditorTopicOptions } from '../components/editor/shared/controller.js';
import { setDraftSourceFile } from './draftAutoSave.js';
import { isSupportedDraft } from './draftSerializer.js';
import { clearDraft, getDraft } from './draftStore.js';

export async function offerDraftRecovery() {
  let draft;
  try {
    draft = await getDraft();
  } catch (error) {
    console.warn('Could not read local draft:', error);
    return;
  }
  if (!isSupportedDraft(draft)) return;

  const dialog = document.getElementById('draftRecoveryDialog');
  const summary = document.getElementById('draftRecoverySummary');
  const restoreButton = document.getElementById('restoreDraftBtn');
  const discardButton = document.getElementById('discardDraftBtn');

  summary.textContent = `A local draft from ${new Date(draft.savedAt).toLocaleString()} is available${draft.sourceFileName ? ` for ${draft.sourceFileName}` : ''}.`;

  return new Promise(resolve => {
    restoreButton.addEventListener('click', () => {
      loadState(draft.state);
      setDraftSourceFile(draft.sourceFile, draft.sourceFileName);
      setEditorTopicOptions();
      appState.step = 2;
      renderStep();
      renderRecoveryStatus('Restored your local draft.', 'success');
      dialog.close();
      resolve();
    }, { once: true });

    discardButton.addEventListener('click', async () => {
      await clearDraft();
      dialog.close();
      resolve();
    }, { once: true });

    dialog.addEventListener('cancel', event => event.preventDefault());
    dialog.showModal();
  });
}

export async function discardLocalDraft() {
  await clearDraft();
  setDraftSourceFile(null);
}

function renderRecoveryStatus(message, type) {
  const status = document.getElementById('loadStatus');
  status.textContent = message;
  status.className = `status ${type}`;
}
