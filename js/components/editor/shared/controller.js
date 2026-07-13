import { initTopicEditor } from "../topic/controller.js";
import { getSelectedIssue, initIssueEditor } from "../issue/controller.js";
import { initParamEditor } from "../parameter/controller.js";
import { initRecomEditor } from "../recommendationMatrix/controller.js";

import { initSharedEditorDom, sharedEditorDom, renderEditorStatus } from "./dom.js";

import { buildIssueFlowchart } from "../../preview/flowchart.js";
import { setGraph, setIssueSummary } from "../../preview/controller.js";
import { setStatus } from "../../upload/controller.js";

import { saveWorkbookData } from "../../../fileService.js";
import { appState, renderStep } from "../../../state.js";

export function initEditor() {
  initTopicEditor();
  initIssueEditor();
  initParamEditor();
  initRecomEditor();
  initSharedEditor();
}

export function initSharedEditor() {
  initSharedEditorDom();

  sharedEditorDom.saveSheetBtn.addEventListener('click', saveSheet);
}

export async function renderSelectedIssuePreview() {
  setIssueSummary(getSelectedIssue());
  const graphDefinition = buildIssueFlowchart(getSelectedIssue());
  await setGraph(graphDefinition);
  setStatus('Editor changes saved to app state. Export workbook to persist them.', 'success');

  appState.step = 3;
  renderStep();
}

export async function saveSheet() {
  await saveWorkbookData(appState)
}

export function setEditorStatus(message, type = '') {
  renderEditorStatus(message, type);
}