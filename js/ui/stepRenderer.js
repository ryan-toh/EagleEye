/** Updates the top-level panels from the current UI step. */
export function renderStep(step) {
  document.getElementById('upload-panel').classList.toggle('hidden', step >= 2);
  document.getElementById('editor-panel').classList.toggle('hidden', step < 2);
  document.getElementById('preview-panel').classList.toggle('hidden', step < 2);
}
