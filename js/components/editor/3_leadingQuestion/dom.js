import {
  appState,
  getQuestionLeadingQuestions,
  makeUniqueId,
} from '../../../appState.js';
import { isRequired, str } from '../../../utils.js';
import {
  getClickedExplorerId,
  renderExplorerEmpty,
  renderExplorerList,
  setExplorerSelectedState,
} from '../shared/explorerList.js';

export const paramEditorDom = {};

export function initParamEditorDom() {
  Object.assign(paramEditorDom, {
    leadingQuestionId: document.getElementById('editorLeadingQuestionId'),
    leadingQuestionName: document.getElementById('editorLeadingQuestionName'),
    leadingQuestionQuestion: document.getElementById('editorLeadingQuestionQuestion'),
    leadingQuestionRequired: document.getElementById('editorLeadingQuestionRequired'),
    leadingQuestionAllowedValues: document.getElementById(
      'editorLeadingQuestionAllowedValues',
    ),
    leadingQuestionExampleValues: document.getElementById(
      'editorLeadingQuestionExampleValues',
    ),
    leadingQuestionOrder: document.getElementById('editorLeadingQuestionOrder'),
    saveLeadingQuestionBtn: document.getElementById('saveLeadingQuestionBtn'),
    createParamBtn: document.getElementById('createParamBtn'),
    paramSelect: document.getElementById('editorParamSelect'),
    paramList: document.getElementById('editorParamList'),
    paramPanelHint: document.getElementById('editorParamPanelHint'),
    paramDialog: document.getElementById('editorParamDialog'),
  });
}

/** Controller Functions */

export function setParamSelectedState(paramId) {
  setExplorerSelectedState(paramEditorDom.paramList, 'paramId', paramId);
}

export function renderParamOptions(questionId) {
  const params = questionId ? getQuestionLeadingQuestions(questionId) : [];

  if (!questionId) {
    paramEditorDom.paramPanelHint.textContent = 'Select an question first';
    renderExplorerEmpty(paramEditorDom.paramList, 'Select an question first');
    return;
  }

  paramEditorDom.paramPanelHint.textContent =
    'Create or double click on leadingQuestion to edit';

  renderExplorerList({
    container: paramEditorDom.paramList,
    items: params,
    query: '',
    selectedId: paramEditorDom.paramSelect.value,
    datasetKey: 'paramId',
    getId: (param) => param.leadingQuestion_id,
    getTitle: (param) => param.leadingQuestion_name,
    getMeta: (param) => param.question_to_ask || '',
    type: 'param',
    icon: '✏️',
    emptyMessage: (allParams) =>
      allParams.length
        ? 'No leadingQuestions match your search'
        : 'No leadingQuestions found for this question',
  });
}

export function getClickedParamId(event) {
  return getClickedExplorerId(event, 'paramId');
}

export function renderParamFormFor(leadingQuestionId, questionId) {
  const leadingQuestions = questionId ? getQuestionLeadingQuestions(questionId) : [];
  const leadingQuestion = leadingQuestions.find(
    (item) => str(item.leadingQuestion_id) === str(leadingQuestionId),
  );

  paramEditorDom.leadingQuestionId.value =
    leadingQuestion?.leadingQuestion_id ||
    makeUniqueId('PARAM', appState.leadingQuestions, 'leadingQuestion_id');
  paramEditorDom.leadingQuestionName.value = leadingQuestion?.leadingQuestion_name || '';
  paramEditorDom.leadingQuestionQuestion.value = leadingQuestion?.question_to_ask || '';
  paramEditorDom.leadingQuestionRequired.value =
    leadingQuestion == null || isRequired(leadingQuestion.required) ? 'yes' : 'no';
  paramEditorDom.leadingQuestionAllowedValues.value = leadingQuestion?.allowed_values || '';
  paramEditorDom.leadingQuestionExampleValues.value = leadingQuestion?.example_values || '';
  paramEditorDom.leadingQuestionOrder.value =
    leadingQuestion?.order || leadingQuestions.length + 1;
}
