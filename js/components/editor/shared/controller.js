import {
  clearTopicForm,
  initTopicEditor,
  refreshTopicPicker,
  setTopicOptions,
} from '../1_topic/controller.js';
import {
  getSelectedIssue,
  handleTopicSelection,
  initIssueEditor,
} from '../2_issue/controller.js';
import { initParamEditor } from '../3_parameter/controller.js';
import { initRecomEditor } from '../4_recommendationMatrix/controller.js';

import {
  initSharedEditorDom,
  sharedEditorDom,
  renderEditorStatus,
} from './dom.js';

import { buildIssueFlowchart } from '../../preview/flowchart.js';
import {
  clearIssueView,
  setGraph,
  setIssueSummary,
} from '../../preview/controller.js';
import { setStatus } from '../../upload/controller.js';

import { saveWorkbookData } from '../../../fileService.js';
import { appState, renderStep } from '../../../appState.js';

export function initEditor() {
  initTopicEditor();
  initIssueEditor();
  initParamEditor();
  initRecomEditor();
  initSharedEditor();
}

export function initSharedEditor() {
  initSharedEditorDom();

  sharedEditorDom.backToUploadsBtn.addEventListener('click', () => {
    appState.step = 1;
    renderStep();
  });
  sharedEditorDom.saveSheetBtn.addEventListener('click', saveSheet);
  initResizableEditorColumns();
}

export function setEditorTopicOptions() {
  refreshTopicPicker();
  clearTopicForm();

  setTopicOptions();
  handleTopicSelection('');
}

export async function renderSelectedIssuePreview() {
  const issueId = getSelectedIssue();
  if (!issueId) {
    clearIssueView();
    return;
  }

  setIssueSummary(issueId);

  const graphDefinition = buildIssueFlowchart(issueId);
  const result = await setGraph(graphDefinition);

  if (!result.ok) {
    setStatus(
      'Files are loaded, but Mermaid could not render the selected issue',
      'error',
    );
  }

  appState.step = 3;
  renderStep();
}

export async function saveSheet() {
  await saveWorkbookData(appState);
}

export function setEditorStatus(message, type = '') {
  renderEditorStatus(message, type);
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

function initResizableEditorColumns() {
  const explorer = sharedEditorDom.editorExplorer;
  const desktopLayout = window.matchMedia('(min-width: 1181px)');
  const minWidths = [160, 180, 180, 320];
  let resizeState = null;

  explorer.addEventListener('pointermove', (event) => {
    if (resizeState || !desktopLayout.matches) return;
    const pane = event.target.closest('.decision-explorer__pane');
    const panes = [
      ...explorer.querySelectorAll(':scope > .decision-explorer__pane'),
    ];
    const isResizable = pane && panes.indexOf(pane) < panes.length - 1;
    const nearRightEdge =
      isResizable && pane.getBoundingClientRect().right - event.clientX < 10;
    explorer.style.cursor = nearRightEdge ? 'col-resize' : '';
  });

  explorer.addEventListener('pointerdown', (event) => {
    if (!desktopLayout.matches || event.button !== 0) return;

    const pane = event.target.closest('.decision-explorer__pane');
    const panes = [
      ...explorer.querySelectorAll(':scope > .decision-explorer__pane'),
    ];
    const index = panes.indexOf(pane);
    if (
      index < 0 ||
      index === panes.length - 1 ||
      pane.getBoundingClientRect().right - event.clientX >= 10
    )
      return;

    resizeState = {
      index,
      startX: event.clientX,
      widths: panes.map((item) => item.getBoundingClientRect().width),
    };
    explorer.classList.add('is-resizing');
    explorer.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  explorer.addEventListener('pointermove', (event) => {
    if (!resizeState) return;

    const { index, startX, widths } = resizeState;
    const combinedWidth = widths[index] + widths[index + 1];
    const nextWidth = Math.max(
      minWidths[index],
      Math.min(
        widths[index] + event.clientX - startX,
        combinedWidth - minWidths[index + 1],
      ),
    );
    const adjustedWidths = [...widths];
    adjustedWidths[index] = nextWidth;
    adjustedWidths[index + 1] = combinedWidth - nextWidth;
    explorer.style.gridTemplateColumns = adjustedWidths
      .map((width) => `${width}px`)
      .join(' ');
  });

  const stopResizing = (event) => {
    if (!resizeState) return;
    resizeState = null;
    explorer.classList.remove('is-resizing');
    explorer.style.cursor = '';
    if (explorer.hasPointerCapture(event.pointerId))
      explorer.releasePointerCapture(event.pointerId);
  };

  explorer.addEventListener('pointerup', stopResizing);
  explorer.addEventListener('pointercancel', stopResizing);
  desktopLayout.addEventListener('change', (event) => {
    if (!event.matches) explorer.style.gridTemplateColumns = '';
  });
}
