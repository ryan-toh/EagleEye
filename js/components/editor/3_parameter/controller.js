import { getSelectedIssue } from "../2_issue/controller.js";
import { initParamEditorDom, paramEditorDom, renderParameterPicker, renderParamFormFor, renderParamOptions, getClickedParamId, setParamSelectedState } from "./dom.js";
import { upsertParameter } from "../../../appState.js";
import { setEditorStatus, closeDialog } from "../shared/controller.js";

export function initParamEditor() {
    initParamEditorDom();

    paramEditorDom.parameterPicker.addEventListener('change', onParamPicked);
    paramEditorDom.saveParameterBtn.addEventListener('click', onSaveParameter);
    paramEditorDom.createParamBtn.addEventListener('click', onCreateParam);

    paramEditorDom.paramList.addEventListener('click', onParamClick);
    paramEditorDom.paramList.addEventListener('dblclick', onParamDblClick);
}

export function refreshParamPicker(issueId) {
    renderParameterPicker(issueId);
}

export function refreshParam(issueId) {
  handleIssueSelection(issueId);
}

export function clearParamForm() {
  renderParamFormFor('__new__', getSelectedIssue());
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

  selectParameterForEditing(paramId);
  paramEditorDom.paramDialog.showModal();
}

export function setDomParamValue(value) {
  paramEditorDom.paramSelect.value = value;
  setParamSelectedState(value);
}

export function handleIssueSelection(issueId) {
  renderParamOptions(issueId);
  renderParameterPicker(issueId);
  clearParamForm();
  setDomParamValue('');
}

export function selectParameter(paramId) {
  paramEditorDom.parameterPicker.value = paramId;
  setDomParamValue(paramId);
}

export function setParamOptions(issueId) {
  renderParamOptions(issueId);
}

export function onParamPicked() {
    const paramId = paramEditorDom.parameterPicker.value;

    renderParamFormFor(paramId, getSelectedIssue());
    setDomParamValue(paramId === '__new__' ? '' : paramId);
}

export function setParamForm(paramId) {
    renderParamFormFor(paramId, getSelectedIssue());
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
    selectParameter(param_id);
    renderParamOptions(issue_id);

    closeDialog(paramEditorDom.paramDialog);

    setEditorStatus('Parameter saved.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function onCreateParam() {
  if (paramEditorDom.parameterPicker.disabled) {
    setEditorStatus('Select an issue before creating a parameter.', 'error');
    return;
  }

  selectParameterForEditing('__new__');
  paramEditorDom.paramDialog.showModal();
}

function selectParameterForEditing(paramId) {
  selectParameter(paramId);
  renderParamFormFor(paramId, getSelectedIssue());
}

