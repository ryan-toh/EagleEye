import { saveWorkbookData } from "../../fileService.js";
import { setStatus } from "./controller.js";

export const uploadDom = {};

export function initUploadDomElements() {
    Object.assign(uploadDom, {
            loadBtn: document.getElementById('loadBtn'),
            loadStatus: document.getElementById('loadStatus'),
            downloadSheetTemplateBtn: document.getElementById('downloadSheetTemplateBtn'),
            fileInputBtn: document.getElementById('botInputFile'),
    })

    return uploadDom;
}

export function disableLoading(message) {
  setStatus(message, 'error');
  uploadDom.loadBtn.disabled = true;
}

export function renderStatus(message, type = '') {
  uploadDom.loadStatus.textContent = message;
  uploadDom.loadStatus.className = `status ${type}`.trim();
}

export function getFileInput() {
  return uploadDom.fileInputBtn;
}

