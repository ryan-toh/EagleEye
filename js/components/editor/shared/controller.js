import {
  clearTopicForm,
  initTopicEditor,
  setTopicOptions,
} from '../1_topic/controller.js';
import { getSelectedIssue, initIssueEditor } from '../2_issue/controller.js';
import {
  selectTopic,
  subscribeToIssuePreviewRefresh,
} from '../editorCoordinator.js';
import { initParamEditor } from '../3_parameter/controller.js';
import { initRecomEditor } from '../4_recommendationMatrix/controller.js';
import { initGlobalSearch } from '../globalSearch/controller.js';

import {
  initSharedEditorDom,
  sharedEditorDom,
  renderEditorStatus,
} from './dom.js';

import { buildDecisionGraph } from '../../preview/decisionGraph.js';
import { buildIssuePreview } from '../../../domain/issuePreview.js';
import {
  clearIssueView,
  setGraph,
  setIssueSummary,
} from '../../preview/controller.js';
import { notify, subscribeToNotifications } from '../../../ui/notifications.js';

import { saveWorkbookData } from '../../../fileService.js';
import {
  getIssue,
  getIssueParameters,
  getIssueRules,
  getRecommendationMap,
  getRecommendationsForRules,
  getTopicName,
  getWorkbookData,
} from '../../../appState.js';
import { renderStep } from '../../../ui/stepRenderer.js';
import { setStep, uiState } from '../../../ui/uiState.js';

export function initEditor() {
  initTopicEditor();
  initIssueEditor();
  initParamEditor();
  initRecomEditor();
  initGlobalSearch();
  initSharedEditor();
}

export function initSharedEditor() {
  initSharedEditorDom();
  subscribeToNotifications(({ message, type }) =>
    setEditorStatus(message, type),
  );
  subscribeToIssuePreviewRefresh(() => void renderSelectedIssuePreview());

  sharedEditorDom.backToUploadsBtn.addEventListener('click', () => {
    setStep(1);
    renderStep(uiState.step);
  });
  sharedEditorDom.saveSheetBtn.addEventListener('click', saveSheet);
}

export function setEditorTopicOptions() {
  clearTopicForm();

  setTopicOptions();
  selectTopic('');
}

async function renderSelectedIssuePreview() {
  const issueId = getSelectedIssue();
  if (!issueId) {
    clearIssueView();
    return;
  }

  const issue = getIssue(issueId);
  const parameters = getIssueParameters(issueId);
  const rules = getIssueRules(issueId);
  const recommendations = getRecommendationsForRules(rules);
  setIssueSummary(
    buildIssuePreview({ issue, parameters, rules, recommendations }),
  );

  try {
    const graphDefinition = buildDecisionGraph({
      issue,
      topicName: getTopicName(issue.topic_id),
      parameters,
      rules,
      recommendationById: getRecommendationMap(),
    });
    const result = await setGraph(graphDefinition);

    if (result.stale) return;

    if (!result.ok) {
      notify(
        'Files are loaded, but Mermaid could not render the selected issue',
        'error',
      );
    }
  } catch {
    notify(
      'The issue summary is available, but Mermaid could not render the selected issue',
      'error',
    );
  }
}

async function saveSheet() {
  await saveWorkbookData(getWorkbookData());
}

function setEditorStatus(message, type = '') {
  renderEditorStatus(message, type);
}
