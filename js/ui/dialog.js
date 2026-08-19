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
