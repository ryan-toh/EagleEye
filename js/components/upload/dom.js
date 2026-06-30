import { getRequiredElement } from "../../utils.js";
import { saveWorkbookData } from "./fileService.js";

export const uploadDom = {};

export function initUploadDomElements() {
    Object.assign(uploadDom, {
            loadBtn:             document.getElementById('loadBtn'),
            loadStatus:          document.getElementById('loadStatus'),
            saveSheetBtn:        document.getElementById('saveSheetBtn'),
            fileInputBtn:        document.getElementById('botInputFile'),
    })

    return uploadDom;
}

export function disableLoading(message) {
  setStatus(message, 'error');
  uploadDom.loadBtn.disabled = true;
}

export function setStatus(message, type = '') {
  uploadDom.loadStatus.textContent = message;
  uploadDom.loadStatus.className = `status ${type}`.trim();
}

export function getFileInput() {
  return uploadDom.fileInputBtn;
}

