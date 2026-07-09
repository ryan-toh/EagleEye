import { buildIssueFlowchart } from '../preview/flowchart.js';
import { setGraph, setIssueSummary } from '../preview/controller.js';
import { setDomTopicValue, getDomTopicValue, setDomIssueValue, setTopicOptions, setIssueOptions, onTopicChange } from '../viewer/controller.js';
import { setStatus } from '../upload/controller.js';
import { renderStep, appState, setSelectedIssue, setSelectedTopic, upsertIssue, upsertParameter, upsertTopic } from '../../state.js';
import { saveCombinationRecommendations } from './service.js';
import {
  collectCombinationRows,
  editorDom,
  fillIssueForm,
  fillParameterForm,
  fillTopicForm,
  initEditorDom,
  refreshEditorPickers,
  renderIssuePicker,
  renderParameterPicker,
  renderRecommendationMatrix,
  renderTopicPicker,
  setEditorStatus
} from './dom.js';
import { saveWorkbookData } from '../../fileService.js';
import { viewerDom } from '../viewer/dom.js';

export function initEditor() {
  initEditorDom();

  editorDom.topicPicker.addEventListener('change', onEditorTopicPicked);
  editorDom.issuePicker.addEventListener('change', onEditorIssuePicked);
  
  editorDom.parameterPicker.addEventListener('change', () => fillParameterForm(editorDom.parameterPicker.value));

  editorDom.saveTopicBtn.addEventListener('click', onSaveTopic);
  editorDom.saveIssueBtn.addEventListener('click', onSaveIssue);
  editorDom.saveParameterBtn.addEventListener('click', onSaveParameter);
  editorDom.buildCombinationsBtn.addEventListener('click', onBuildCombinations);
  editorDom.saveCombinationRulesBtn.addEventListener('click', onSaveCombinationRules);

  editorDom.saveSheetBtn.addEventListener('click', saveSheet);

  refreshEditorPickers();
}

export function refreshEditor() {
  refreshEditorPickers();
}

export function onEditorTopicPicked() {
  const topicId = editorDom.topicPicker.value;

  fillTopicForm(topicId);

  if (topicId !== '__new__') {
    setSelectedTopic(topicId);
    // viewerDom.topicSelect.value = topicId;
    setDomTopicValue(topicId);
    setIssueOptions(topicId);
  }

  renderIssuePicker(appState.selectedTopicId);
}

export function setEditorDomTopicValue(value) {

}

function onEditorIssuePicked() {
  const issueId = editorDom.issuePicker.value;
  fillIssueForm(issueId);

  if (issueId !== '__new__') {
    setSelectedIssue(issueId);
    // viewerDom.issueSelect.value = issueId;
    setDomIssueValue(issueId);
    renderParameterPicker(issueId);
    renderSelectedIssuePreview();
  }

}

function onSaveTopic() {
  try {
    const topic = upsertTopic({
      topic_id: editorDom.topicId.value,
      topic_name: editorDom.topicName.value,
      description: editorDom.topicDescription.value,
      example_phrases: editorDom.topicExamples.value
    });

    setTopicOptions();
    // viewerDom.topicSelect.value = topic.topic_id;
    setDomTopicValue(topic.topic_id);
    setSelectedTopic(topic.topic_id);
    setIssueOptions(topic.topic_id);

    renderTopicPicker();

    renderIssuePicker(topic.topic_id);
    renderParameterPicker(topic.topic_id);  

    setEditorStatus('Topic saved.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function onSaveIssue() {
  try {
    if (!appState.selectedTopicId) {
      throw new Error('Select or save a topic before saving an issue.');
    }

    const issue = upsertIssue({
      issue_id: editorDom.issueId.value,
      topic_id: appState.selectedTopicId,
      issue_name: editorDom.issueName.value,
      issue_description: editorDom.issueDescription.value,
      example_phrases: editorDom.issueExamples.value
    });

    setIssueOptions(issue.topic_id);
    // viewerDom.issueSelect.value = issue.issue_id;
    setDomIssueValue(issue.issue_id)
    renderIssuePicker(issue.topic_id);
    renderParameterPicker(issue.issue_id);
    renderSelectedIssuePreview();
    setEditorStatus('Issue saved.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function onSaveParameter() {
  try {
    if (!appState.selectedIssueId) {
      throw new Error('Select or save an issue before saving parameters.');
    }

    upsertParameter({
      issue_id: appState.selectedIssueId,
      parameter_id: editorDom.parameterId.value,
      parameter_name: editorDom.parameterName.value,
      question_to_ask: editorDom.parameterQuestion.value,
      required: editorDom.parameterRequired.value,
      allowed_values: editorDom.parameterAllowedValues.value,
      example_values: editorDom.parameterExampleValues.value,
      order: editorDom.parameterOrder.value
    });

    renderParameterPicker(appState.selectedIssueId);
    renderSelectedIssuePreview();
    setEditorStatus('Parameter saved.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function onBuildCombinations() {
  try {
    if (!appState.selectedIssueId) {
      throw new Error('Select or save an issue first.');
    }

    renderRecommendationMatrix(appState.selectedIssueId);
    setEditorStatus('Recommendation matrix generated. Fill rows you want to save.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function onSaveCombinationRules() {
  try {
    if (!appState.selectedIssueId) {
      throw new Error('Select or save an issue first.');
    }

    const rows = collectCombinationRows();

    
    const savedCount = saveCombinationRecommendations(appState.selectedIssueId, rows);
    renderSelectedIssuePreview();
    setEditorStatus(`${savedCount} recommendation/rule row(s) saved.`, 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

async function renderSelectedIssuePreview() {
  if (!appState.selectedIssueId) return;

  setIssueSummary(appState.selectedIssueId);
  const graphDefinition = buildIssueFlowchart(appState.selectedIssueId);
  await setGraph(graphDefinition);
  setStatus('Editor changes saved to app state. Export workbook to persist them.', 'success');

  appState.step = 3;
  renderStep();
}

export async function saveSheet() {
  await saveWorkbookData(appState)
}