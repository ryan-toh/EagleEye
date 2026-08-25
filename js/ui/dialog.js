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
