import { renderUserGuideText, initUserGuideDom } from './dom.js';
import { toHtml } from '../../utils.js';

document.addEventListener('DOMContentLoaded', main);

function main() {
  initUserGuideDom();
  loadUserGuide();
}

async function loadUserGuide() {
  try {
    const response = await fetch('../../README.md');

    if (!response.ok) {
      throw new Error(`Failed to load markdown: ${response.status}`);
    }

    const markdown = await response.text();
    renderUserGuideText(toHtml(markdown));
  } catch (error) {
    console.error('Could not load README.md:', error);
  }
}
