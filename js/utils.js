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
  return ['yes', 'y', 'true', 'required', '1'].includes(
    str(value).toLowerCase(),
  );
}

export function validateLibraries() {
  if (!window.XLSX) {
    throw new Error(
      'XLSX library not loaded. Check the script tag in index.html.',
    );
  }

  if (!window.mermaid) {
    throw new Error(
      'Mermaid library not loaded. Check the script tag in index.html.',
    );
  }

  if (!window.marked) {
    throw new Error(
      `Marked library not loaded. Check the script tag in index.html.`,
    );
  }
}

export function toHtml(markdown) {
  const renderer = new window.marked.Renderer();

  // to allow site navigation to work
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);

    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    return `<h${depth} id="${slug}">${text}</h${depth}>`;
  };

  window.marked.use({ renderer });

  return window.marked.parse(markdown);
}
