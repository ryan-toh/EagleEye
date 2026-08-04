import {
  clearTopicForm,
  initTopicEditor,
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
}

export function setEditorTopicOptions() {
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

  try {
    const graphDefinition = buildIssueFlowchart(issueId);
    const result = await setGraph(graphDefinition);

    if (!result.ok) {
      setStatus(
        'Files are loaded, but Mermaid could not render the selected issue',
        'error',
      );
    }
  } catch {
    setStatus(
      'The issue summary is available, but Mermaid could not render the selected issue',
      'error',
    );
  }
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
