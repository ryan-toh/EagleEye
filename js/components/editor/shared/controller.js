import { initTopicEditor, refreshTopicPicker } from "../1_topic/controller.js";
import { getSelectedIssue, initIssueEditor } from "../2_issue/controller.js";
import { initParamEditor } from "../3_parameter/controller.js";
import { initRecomEditor } from "../4_recommendationMatrix/controller.js";

import { initSharedEditorDom, sharedEditorDom, renderEditorStatus } from "./dom.js";

import { buildIssueFlowchart } from "../../preview/flowchart.js";
import { setGraph, setIssueSummary } from "../../preview/controller.js";
import { setStatus } from "../../upload/controller.js";

import { saveWorkbookData } from "../../../fileService.js";
import { appState, renderStep } from "../../../appState.js";

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

export function setEditorTopicOptions() {
  refreshTopicPicker();
}

export async function renderSelectedIssuePreview() {
  setIssueSummary(getSelectedIssue());

  const graphDefinition = buildIssueFlowchart(getSelectedIssue());
  const result = await setGraph(graphDefinition);

  if (!result.ok) {
    setStatus('Files are loaded, but Mermaid could not render the selected issue', 'error');
  }
  
  appState.step = 3;
  renderStep();
}

export async function saveSheet() {
  await saveWorkbookData(appState)
}

export function setEditorStatus(message, type = '') {
  renderEditorStatus(message, type);
}