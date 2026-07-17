import { getSelectedIssue } from "../2_issue/controller.js";
import { initParamEditorDom, paramEditorDom, renderParameterPicker, renderParamFormFor, renderParamOptions, getClickedParamId, setParamSelectedState } from "./dom.js";
import { upsertParameter } from "../../../appState.js";
import { setEditorStatus, closeDialog } from "../shared/controller.js";

export function initParamEditor() {
    initParamEditorDom();

    paramEditorDom.parameterPicker.addEventListener('change', onParamPicked);
    paramEditorDom.saveParameterBtn.addEventListener('click', onSaveParameter);

    paramEditorDom.paramList.addEventListener('click', onParamClick);
    paramEditorDom.paramList.addEventListener('dblclick', onParamDblClick);
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

export function onParamClick(event) {
  const paramId = getClickedParamId(event);

  if (!paramId) {
    setEditorStatus("invalid param id.", "error");
    return;
  }

  setDomParamValue(paramId);
}

function onParamDblClick(event) {
  const paramId = getClickedParamId(event);

  if (!paramId) {
    setEditorStatus("invalid param id.", "error");
    return;
  }

  renderParamFormFor(paramId);

  paramEditorDom.paramDialog.showModal();
}

export function setDomParamValue(value) {
  paramEditorDom.paramSelect.value = value;
  setParamSelectedState(value);
}

export function setParamOptions(issueId) {
  renderParamOptions(issueId);
}

export function onParamPicked() {
    const paramId = paramEditorDom.parameterPicker.value;

    renderParamFormFor(paramId);
}

export function setParamForm(paramId) {
    renderParamFormFor(paramId);
}

function onSaveParameter() {
  try {
    const issue_id = getSelectedIssue();
    const param_id = paramEditorDom.parameterId.value;

    upsertParameter({
      issue_id: issue_id,
      parameter_id: param_id,
      parameter_name: paramEditorDom.parameterName.value,
      question_to_ask: paramEditorDom.parameterQuestion.value,
      required: paramEditorDom.parameterRequired.value,
      allowed_values: paramEditorDom.parameterAllowedValues.value,
      example_values: paramEditorDom.parameterExampleValues.value,
      order: paramEditorDom.parameterOrder.value
    });

    renderParameterPicker(issue_id);

    // To restore state
    paramEditorDom.parameterPicker.value = param_id;
    paramEditorDom.parameterId.value = param_id;
    setDomParamValue(param_id);

    renderParamOptions(issue_id);

    closeDialog(paramEditorDom.paramDialog);

    setEditorStatus('Parameter saved.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

