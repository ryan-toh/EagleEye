const scrollPositions = new WeakMap();

/** Opens a modal without moving the user's document viewport. */
export function openDialog(dialog) {
  scrollPositions.set(dialog, {
    left: window.scrollX,
    top: window.scrollY,
  });
  dialog.showModal();

  // Opening a dialog focuses its first field. Restore the viewport if that
  // focus operation caused the browser to scroll the document.
  requestAnimationFrame(() => restoreDialogScrollPosition(dialog));
}

export function closeDialog(dialog) {
  dialog.classList.add('closing');

  dialog.addEventListener(
    'animationend',
    () => {
      dialog.classList.remove('closing');
      dialog.close();
    },
    { once: true },
  );
}

/** Restores the viewport used when this dialog was opened. */
export function restoreDialogScrollPosition(dialog, { clear = false } = {}) {
  const scrollPosition = scrollPositions.get(dialog);
  if (!scrollPosition) return;

  requestAnimationFrame(() => {
    window.scrollTo(scrollPosition.left, scrollPosition.top);
    if (clear) scrollPositions.delete(dialog);
  });
}

/** Registers restoration for every way a native dialog can be closed. */
export function preserveDialogScrollPosition(dialog) {
  dialog.addEventListener('close', () =>
    restoreDialogScrollPosition(dialog, { clear: true }),
  );
}

export function showDialogError(dialog, message) {
  let error = dialog.querySelector('[data-dialog-error]');
  if (!error) {
    error = document.createElement('p');
    error.dataset.dialogError = '';
    error.className = 'dialog-error';
    error.setAttribute('role', 'alert');
    dialog.querySelector('h3').insertAdjacentElement('afterend', error);
  }
  error.textContent = message;
}

export function clearDialogError(dialog) {
  dialog.querySelector('[data-dialog-error]')?.remove();
}

export function confirmDeletion(entityName, consequence = '') {
  const detail = consequence ? ` ${consequence}` : '';
  return window.confirm(`Delete this ${entityName}?${detail}`);
}
