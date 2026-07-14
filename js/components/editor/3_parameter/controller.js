import { getSelectedIssue } from "../2_issue/controller.js";
import { initParamEditorDom, paramEditorDom, renderParameterPicker, renderParamFormFor } from "./dom.js";
import { upsertParameter } from "../../../appState.js";
import { setEditorStatus } from "../shared/controller.js";

export function initParamEditor() {
    initParamEditorDom();

    paramEditorDom.parameterPicker.addEventListener('change', onEditorParamPicked);
    paramEditorDom.saveParameterBtn.addEventListener('click', onSaveParameter);
    
}

export function refreshParamPicker(issueId) {
    renderParameterPicker(issueId);
}

export function refreshParam(issueId) {
  refreshParamPicker(issueId);
  clearParamForm();
}

export function clearParamForm() {
  renderParamFormFor('__new__');
}

export function onEditorParamPicked() {
    const paramId = paramEditorDom.parameterPicker.value;
    renderParamFormFor(paramId);
}

export function setParamForm(paramId) {
    renderParamFormFor(paramId);
}

function onSaveParameter() {
  try {
    const issue_id = getSelectedIssue();
    const parameter_id = paramEditorDom.parameterId.value;

    upsertParameter({
      issue_id: issue_id,
      parameter_id: parameter_id,
      parameter_name: paramEditorDom.parameterName.value,
      question_to_ask: paramEditorDom.parameterQuestion.value,
      required: paramEditorDom.parameterRequired.value,
      allowed_values: paramEditorDom.parameterAllowedValues.value,
      example_values: paramEditorDom.parameterExampleValues.value,
      order: paramEditorDom.parameterOrder.value
    });

    renderParameterPicker(issue_id);

    // To restore state
    paramEditorDom.parameterPicker.value = parameter_id;

    setEditorStatus('Parameter saved.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

