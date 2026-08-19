const EXPLORER_ROW_SELECTOR = '.decision-explorer__row';
const DRAG_STATE_SELECTOR =
  '.decision-explorer__row.is-dragging, .decision-explorer__row.is-drop-target';

export function startExplorerDrag(event, id, mimeType) {
  if (!id) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(mimeType, id);
  event.target.closest(EXPLORER_ROW_SELECTOR)?.classList.add('is-dragging');
}

export function supportsExplorerDrag(event, mimeType) {
  return event.dataTransfer.types.includes(mimeType);
}

export function markExplorerDropTarget(container, target) {
  container
    .querySelectorAll('.is-drop-target')
    .forEach((row) => row.classList.remove('is-drop-target'));
  target.closest(EXPLORER_ROW_SELECTOR)?.classList.add('is-drop-target');
}

export function clearExplorerDragState() {
  document
    .querySelectorAll(DRAG_STATE_SELECTOR)
    .forEach((row) => row.classList.remove('is-dragging', 'is-drop-target'));
}

export function getExplorerDragId(event, mimeType) {
  return event.dataTransfer.getData(mimeType);
}
