import { appState, getIssuesForTopic, getIssueParameters, makeUniqueId } from "../../../appState.js";
import { str } from "../../../utils.js";
import { getSelectedIssue } from "../2_issue/controller.js";

export const paramEditorDom = {};

export function initParamEditorDom() {
    Object.assign(paramEditorDom, {
        parameterPicker: document.getElementById('editorParameterPicker'),
        parameterId: document.getElementById('editorParameterId'),
        parameterName: document.getElementById('editorParameterName'),
        parameterQuestion: document.getElementById('editorParameterQuestion'),
        parameterRequired: document.getElementById('editorParameterRequired'),
        parameterAllowedValues: document.getElementById('editorParameterAllowedValues'),
        parameterExampleValues: document.getElementById('editorParameterExampleValues'),
        parameterOrder: document.getElementById('editorParameterOrder'),
        saveParameterBtn: document.getElementById('saveParameterBtn')
    });
}

export function renderParameterPicker(issueId) {
  paramEditorDom.parameterPicker.innerHTML = '<option value="__new__">+ Create new parameter</option>';

  if (issueId) {
    getIssueParameters(issueId).forEach(parameter => {
      const option = document.createElement('option');
      option.value = str(parameter.parameter_id);
      option.textContent = `${parameter.parameter_name}`;
      paramEditorDom.parameterPicker.appendChild(option);
    });
  }

  const disabled = !issueId;
  paramEditorDom.saveParameterBtn.disabled = disabled;
  paramEditorDom.parameterPicker.disabled = disabled;
  paramEditorDom.parameterPicker.value = '__new__';  
}

export function renderParamFormFor(parameterId) {
  const parameter = getIssueParameters(getSelectedIssue())
    .find(item => str(item.parameter_id) === str(parameterId));

  paramEditorDom.parameterId.value = parameter?.parameter_id || makeUniqueId('PARAM', appState.parameters, 'parameter_id');
  paramEditorDom.parameterName.value = parameter?.parameter_name || '';
  paramEditorDom.parameterQuestion.value = parameter?.question_to_ask || '';
  paramEditorDom.parameterRequired.value = parameter?.required || 'yes';
  paramEditorDom.parameterAllowedValues.value = parameter?.allowed_values || '';
  paramEditorDom.parameterExampleValues.value = parameter?.example_values || '';
  paramEditorDom.parameterOrder.value = parameter?.order || getIssueParameters(getSelectedIssue()).length + 1;
}