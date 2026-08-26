export const sharedEditorDom = {};

export function initSharedEditorDom() {
  Object.assign(sharedEditorDom, {
    editorStatus: document.getElementById('editorStatus'),
    backToUploadsBtn: document.getElementById('backToUploadsBtn'),
    saveSheetBtn: document.getElementById('saveSheetBtn'),
    editorExplorer: document.querySelector('#editor-panel .decision-explorer'),
  });
}

export function renderEditorStatus(message, type = '') {
  sharedEditorDom.editorStatus.textContent = message;
  sharedEditorDom.editorStatus.className = `status ${type}`.trim();
}

export function createExplorerItem({ id, title, meta, type, icon }) {
  const row = document.createElement('div');
  const button = document.createElement('button');
  const deleteButton = document.createElement('button');

  button.type = 'button';
  button.className = 'decision-explorer__item';
  button.draggable = type === 'question' || type === 'param';
  row.className = 'decision-explorer__row';

  deleteButton.type = 'button';
  deleteButton.className = 'decision-explorer__delete';
  deleteButton.setAttribute('aria-label', `Delete ${title}`);
  deleteButton.title = `Delete ${title}`;
  deleteButton.textContent = '-';

  if (type === 'topic') {
    button.dataset.topicId = String(id);
    row.dataset.topicId = String(id);
  }

  if (type === 'question') {
    button.dataset.questionId = String(id);
    row.dataset.questionId = String(id);
  }

  if (type === 'param') {
    button.dataset.paramId = String(id);
    row.dataset.paramId = String(id);
  }

  if (type === 'answer') {
    button.dataset.answerId = String(id);
    row.dataset.answerId = String(id);
  }

  button.innerHTML = `
    <span class="decision-explorer__item-icon" aria-hidden="true">
      ${icon}
    </span>
    <span class="decision-explorer__item-main">
      <span class="decision-explorer__item-title"></span>
      ${meta ? '<span class="decision-explorer__item-meta"></span>' : ''}
    </span>
  `;

  button.querySelector('.decision-explorer__item-title').textContent = title;

  const metaElement = button.querySelector('.decision-explorer__item-meta');

  if (metaElement) {
    metaElement.textContent = meta;
  }

  row.append(button, deleteButton);
  return row;
}
