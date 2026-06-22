export function str(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

export function escapeHtml(value) {
  return str(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function safeMermaidLabel(value) {
  return str(value)
    .replaceAll('"', "'")
    .replaceAll('[', '(')
    .replaceAll(']', ')')
    .replaceAll('{', '(')
    .replaceAll('}', ')')
    .replaceAll('|', '-')
    .slice(0, 180);
}

export function isRequired(value) {
  return ['yes', 'y', 'true', 'required', '1'].includes(str(value).toLowerCase());
}

export function toList(items, renderer) {
  if (!items.length) return '<p class="empty">None found for this issue.</p>';
  return `<ul>${items.map(item => `<li>${renderer(item)}</li>`).join('')}</ul>`;
}