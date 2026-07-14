import { getParametersWithAllowedValues, buildParameterCombinations, getRuleForCombination, getRecommendationForCombination } from "./service.js";
import { escapeHtml, str } from "../../../utils.js";

export const recomEditorDom = {};

export function initRecomEditorDom() {
    Object.assign(recomEditorDom, {
        buildCombinationsBtn: document.getElementById('buildCombinationsBtn'),
        saveCombinationRulesBtn: document.getElementById('saveCombinationRulesBtn'),
        recommendationMatrix: document.getElementById('recommendationMatrix'),
    });
}

export function disableRecomBtns() {
  recomEditorDom.buildCombinationsBtn.disabled = true;
  recomEditorDom.saveCombinationRulesBtn.disabled = true;
}

export function renderRecommendationMatrix(issueId) {
  const parameters = getParametersWithAllowedValues(issueId);
  const combinations = buildParameterCombinations(issueId);

  if (!parameters.length) {
    recomEditorDom.recommendationMatrix.innerHTML = '<p class="empty">Add allowed_values to at least one parameter before building recommendation combinations.</p>';
    recomEditorDom.saveCombinationRulesBtn.disabled = true;
    return;
  }

  if (combinations.length > 200) {
    recomEditorDom.recommendationMatrix.innerHTML = `<p class="status error">This would create ${combinations.length} combinations. Reduce allowed_values before generating the matrix.</p>`;
    recomEditorDom.saveCombinationRulesBtn.disabled = true;
    return;
  }

  const headerCells = parameters.map(param => `<th>${escapeHtml(param.parameter_name)}</th>`).join('');
  const rows = combinations.map((combination, index) => {
    const rule = getRuleForCombination(issueId, combination);
    const rec = getRecommendationForCombination(issueId, combination);
    const conditionCells = parameters.map(param => `<td>${escapeHtml(combination[param.parameter_id])}</td>`).join('');

    return `
      <tr data-combination='${escapeHtml(JSON.stringify(combination))}'>
        ${conditionCells}
        <td><input class="combo-priority" type="number" min="1" value="${escapeHtml(rule?.priority || index + 1)}" /></td>
        <td>
          <select class="combo-decision">
            ${decisionOption('Answered', rec?.final_decision)}
            ${decisionOption('Unanswered', rec?.final_decision)}
            ${decisionOption('Escalate', rec?.final_decision)}
            ${decisionOption('Clarify', rec?.final_decision)}
          </select>
        </td>
        <td><textarea class="combo-text" rows="2">${escapeHtml(rec?.recommendation_text || '')}</textarea></td>
        <td><textarea class="combo-next" rows="2">${escapeHtml(rec?.next_steps || '')}</textarea></td>
        <td><textarea class="combo-escalation" rows="2">${escapeHtml(rec?.escalation_note || '')}</textarea></td>
      </tr>
    `;
  }).join('');

  recomEditorDom.recommendationMatrix.innerHTML = `
    <div class="table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            ${headerCells}
            <th>Priority</th>
            <th>Decision</th>
            <th>Final response</th>
            <th>Next steps</th>
            <th>Escalation note</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  recomEditorDom.saveCombinationRulesBtn.disabled = false;
}

export function collectCombinationRows() {
  return [...recomEditorDom.recommendationMatrix.querySelectorAll('tbody tr')].map(row => ({
    conditions: JSON.parse(row.dataset.combination),
    priority: row.querySelector('.combo-priority').value,
    final_decision: row.querySelector('.combo-decision').value,
    recommendation_text: row.querySelector('.combo-text').value,
    next_steps: row.querySelector('.combo-next').value,
    escalation_note: row.querySelector('.combo-escalation').value
  }));
}

function clearRecommendationMatrix() {
  recomEditorDom.recommendationMatrix.innerHTML = '<p class="empty">Select an issue, add parameters with allowed_values, then build combinations.</p>';
}

function decisionOption(value, selectedValue) {
  return `<option value="${value}" ${str(selectedValue || 'Clarify') === value ? 'selected' : ''}>${value}</option>`;
}