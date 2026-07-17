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

export function createExplorerItem({ id, title, meta, type, icon }) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "decision-explorer__item";

  if (type === "topic") {
    button.dataset.topicId = String(id);
  }

  if (type === "issue") {
    button.dataset.issueId = String(id);
  }

  if (type === "param") {
    button.dataset.paramId = String(id);
  }

  button.innerHTML = `
    <span class="decision-explorer__item-icon" aria-hidden="true">
      ${icon}
    </span>
    <span class="decision-explorer__item-main">
      <span class="decision-explorer__item-title"></span>
      ${
        meta
          ? '<span class="decision-explorer__item-meta"></span>'
          : ""
      }
    </span>
  `;

  button.querySelector(".decision-explorer__item-title").textContent = title;

  const metaElement = button.querySelector(".decision-explorer__item-meta");

  if (metaElement) {
    metaElement.textContent = meta;
  }

  return button;
}