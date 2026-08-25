import {
  appState,
  getIssueParameters,
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
    parameterId: document.getElementById('editorParameterId'),
    parameterName: document.getElementById('editorParameterName'),
    parameterQuestion: document.getElementById('editorParameterQuestion'),
    parameterRequired: document.getElementById('editorParameterRequired'),
    parameterAllowedValues: document.getElementById(
      'editorParameterAllowedValues',
    ),
    parameterExampleValues: document.getElementById(
      'editorParameterExampleValues',
    ),
    parameterOrder: document.getElementById('editorParameterOrder'),
    saveParameterBtn: document.getElementById('saveParameterBtn'),
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

export function renderParamOptions(issueId) {
  const params = issueId ? getIssueParameters(issueId) : [];

  if (!issueId) {
    paramEditorDom.paramPanelHint.textContent = 'Select an issue first';
    renderExplorerEmpty(paramEditorDom.paramList, 'Select an issue first');
    return;
  }

  paramEditorDom.paramPanelHint.textContent =
    'Create or double click on parameter to edit';

  renderExplorerList({
    container: paramEditorDom.paramList,
    items: params,
    query: '',
    selectedId: paramEditorDom.paramSelect.value,
    datasetKey: 'paramId',
    getId: (param) => param.parameter_id,
    getTitle: (param) => param.parameter_name,
    getMeta: (param) => param.question_to_ask || '',
    type: 'param',
    icon: '✏️',
    emptyMessage: (allParams) =>
      allParams.length
        ? 'No parameters match your search'
        : 'No parameters found for this issue',
  });
}

export function getClickedParamId(event) {
  return getClickedExplorerId(event, 'paramId');
}

export function renderParamFormFor(parameterId, issueId) {
  const parameters = issueId ? getIssueParameters(issueId) : [];
  const parameter = parameters.find(
    (item) => str(item.parameter_id) === str(parameterId),
  );

  paramEditorDom.parameterId.value =
    parameter?.parameter_id ||
    makeUniqueId('PARAM', appState.parameters, 'parameter_id');
  paramEditorDom.parameterName.value = parameter?.parameter_name || '';
  paramEditorDom.parameterQuestion.value = parameter?.question_to_ask || '';
  paramEditorDom.parameterRequired.value =
    parameter == null || isRequired(parameter.required) ? 'yes' : 'no';
  paramEditorDom.parameterAllowedValues.value = parameter?.allowed_values || '';
  paramEditorDom.parameterExampleValues.value = parameter?.example_values || '';
  paramEditorDom.parameterOrder.value =
    parameter?.order || parameters.length + 1;
}
