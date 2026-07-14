export const sharedEditorDom = {};

export function initSharedEditorDom() {
  Object.assign(sharedEditorDom, {
    editorStatus: document.getElementById('editorStatus'),
    saveSheetBtn: document.getElementById('saveSheetBtn'),
  });
}

export function renderEditorStatus(message, type = '') {
  sharedEditorDom.editorStatus.textContent = message;
  sharedEditorDom.editorStatus.className = `status ${type}`.trim();
}