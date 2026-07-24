const DRAFT_VERSION = 1;
const STATE_KEYS = ['topics', 'issues', 'parameters', 'rules', 'recommendations'];

export function serializeDraft(appState, sourceFile, sourceFileName = '') {
  const state = Object.fromEntries(
    STATE_KEYS.map(key => [key, appState[key].map(row => ({ ...row }))])
  );

  return {
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    state,
    sourceFile: sourceFile || null,
    sourceFileName: sourceFile?.name || sourceFileName
  };
}

export function isSupportedDraft(draft) {
  return draft?.version === DRAFT_VERSION && STATE_KEYS.every(key => Array.isArray(draft.state?.[key]));
}
