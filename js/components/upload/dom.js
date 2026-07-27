import { setStatus } from "./controller.js";

export const uploadDom = {};

export function initUploadDomElements() {
    Object.assign(uploadDom, {
            loadBtn: document.getElementById('loadBtn'),
            loadLocalBtn: document.getElementById('loadLocalBtn'),
            loadStatus: document.getElementById('loadStatus'),
            downloadSheetTemplateBtn: document.getElementById('downloadSheetTemplateBtn'),
            fileInputBtn: document.getElementById('botInputFile'),
    })

    uploadDom.loadLocalBtn.hidden = !hasLocalSession();

    return uploadDom;
}

export function disableLoading(message) {
  setStatus(message, 'error');
  uploadDom.loadBtn.disabled = true;
}

function hasLocalSession() {
  const requiredStateKeys = [
    'topics',
    'issues',
    'parameters',
    'rules',
    'recommendations',
  ];

  return requiredStateKeys.every((key) => localStorage.getItem(key) !== null);
}

export function renderStatus(message, type = '') {
  uploadDom.loadStatus.textContent = message;
  uploadDom.loadStatus.className = `status ${type}`.trim();
}

export function getFileInput() {
  return uploadDom.fileInputBtn;
}

