import { str } from '../../../utils.js';
import { createExplorerItem } from './dom.js';

export function getClickedExplorerId(event, datasetKey) {
  const item = event.target.closest(`[data-${toKebabCase(datasetKey)}]`);
  return item ? item.dataset[datasetKey] : '';
}

export function setExplorerSelectedState(container, datasetKey, selectedId) {
  container.querySelectorAll('.decision-explorer__item').forEach((item) => {
    item.classList.toggle(
      'is-selected',
      item.dataset[datasetKey] === String(selectedId),
    );
  });
}

export function renderExplorerList({
  container,
  items,
  query,
  selectedId,
  datasetKey,
  getId,
  getTitle,
  getMeta,
  type,
  icon,
  emptyMessage,
}) {
  const normalizedQuery = str(query).toLowerCase();
  const matchingItems = items.filter((item) =>
    str(getTitle(item)).toLowerCase().includes(normalizedQuery),
  );

  container.replaceChildren();
  if (!matchingItems.length) {
    renderExplorerEmpty(container, emptyMessage(items));
    return;
  }

  matchingItems.forEach((item) => {
    container.appendChild(
      createExplorerItem({
        id: getId(item),
        title: getTitle(item),
        meta: getMeta(item),
        type,
        icon,
      }),
    );
  });
  setExplorerSelectedState(container, datasetKey, selectedId);
}

export function renderExplorerEmpty(container, message) {
  const empty = document.createElement('div');
  empty.className = 'decision-explorer__empty';
  empty.textContent = message;
  container.replaceChildren(empty);
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
