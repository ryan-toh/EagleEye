import { hasSavedDecisionTreeState } from '../../persistence/localState.js';

export const uploadDom = {};

export function initUploadDomElements() {
  Object.assign(uploadDom, {
    loadBtn: document.getElementById('loadBtn'),
    loadLocalBtn: document.getElementById('loadLocalBtn'),
    loadStatus: document.getElementById('loadStatus'),
    downloadSheetTemplateBtn: document.getElementById(
      'downloadSheetTemplateBtn',
    ),
    fileInputBtn: document.getElementById('botInputFile'),
  });

  uploadDom.loadLocalBtn.hidden = !hasSavedDecisionTreeState();

  return uploadDom;
}

export function renderStatus(message, type = '') {
  uploadDom.loadStatus.textContent = message;
  uploadDom.loadStatus.className = `status ${type}`.trim();
}

export function getFileInput() {
  return uploadDom.fileInputBtn;
}
