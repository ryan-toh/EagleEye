import { appState, getIssueParameters, makeUniqueId } from "../../../appState.js";
import { isRequired, str } from "../../../utils.js";
import { createExplorerItem } from "../shared/dom.js";

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
        saveParameterBtn: document.getElementById('saveParameterBtn'),
        createParamBtn: document.getElementById('createParamBtn'),

        paramSelect: document.getElementById('editorParamSelect'),
        paramList: document.getElementById('editorParamList'),
        paramPanelHint: document.getElementById('editorParamPanelHint'),
        paramDialog: document.getElementById('editorParamDialog'),

    });
}

export function setParamSelectedState(paramId) {
  setSelectedState(paramEditorDom.paramList, "paramId", paramId);
}

export function renderParamOptions(issueId) {
  const params = issueId ? getIssueParameters(issueId) : [];

  paramEditorDom.paramSelect.value = "";
  paramEditorDom.paramList.innerHTML = "";

  if (!issueId) {
    paramEditorDom.paramPanelHint.textContent = "Select an issue first";
    paramEditorDom.paramList.innerHTML = `
      <div class="decision-explorer__empty">
        Select an issue first
      </div>
    `;
    return;
  }

  paramEditorDom.paramPanelHint.textContent = "Create or double click on parameter to edit";

  if (!params.length) {
    paramEditorDom.paramList.innerHTML = `
      <div class="decision-explorer__empty">
        No parameters found for this issue
      </div>
    `;
    return;
  }

  params.forEach(param => {
    const item = createExplorerItem({
      id: param.parameter_id,
      title: param.parameter_name,
      meta: param.question_to_ask || "",
      type: "param",
      icon: "✏️",
    });

    paramEditorDom.paramList.appendChild(item);
  });
}

export function getClickedParamId(event) {
  const item = event.target.closest("[data-param-id]");
  return item ? item.dataset.paramId : "";
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

export function renderParamFormFor(parameterId, issueId) {
  const parameters = issueId ? getIssueParameters(issueId) : [];
  const parameter = parameters
    .find(item => str(item.parameter_id) === str(parameterId));

  paramEditorDom.parameterId.value = parameter?.parameter_id || makeUniqueId('PARAM', appState.parameters, 'parameter_id');
  paramEditorDom.parameterName.value = parameter?.parameter_name || '';
  paramEditorDom.parameterQuestion.value = parameter?.question_to_ask || '';
  paramEditorDom.parameterRequired.value =
    parameter == null || isRequired(parameter.required)
      ? "yes"
      : "no";
  paramEditorDom.parameterAllowedValues.value = parameter?.allowed_values || '';
  paramEditorDom.parameterExampleValues.value = parameter?.example_values || '';
  paramEditorDom.parameterOrder.value = parameter?.order || parameters.length + 1;
}

function setSelectedState(container, datasetKey, selectedId) {
  const items = container.querySelectorAll(".decision-explorer__item");

  items.forEach(item => {
    item.classList.toggle(
      "is-selected",
      item.dataset[datasetKey] === String(selectedId)
    );
  });
}
