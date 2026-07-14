import { getSelectedIssue } from "../2_issue/controller.js";
import { initRecomEditorDom, recomEditorDom, renderRecommendationMatrix, collectCombinationRows } from "./dom.js";
import { appState } from "../../../appState.js";
import { setEditorStatus, renderSelectedIssuePreview } from "../shared/controller.js";
import { saveCombinationRecommendations } from "./service.js";

export function initRecomEditor() {
    initRecomEditorDom();

    recomEditorDom.buildCombinationsBtn.addEventListener('click', onBuildCombinations);
    recomEditorDom.saveCombinationRulesBtn.addEventListener('click', onSaveCombinationRules);
}

function onBuildCombinations() {
  try {
    renderRecommendationMatrix(getSelectedIssue());
    setEditorStatus('Recommendation matrix generated. Fill rows you want to save.', 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}

function onSaveCombinationRules() {
  try {
    const rows = collectCombinationRows();

    const savedCount = saveCombinationRecommendations(getSelectedIssue(), rows);
    renderSelectedIssuePreview();
    setEditorStatus(`${savedCount} recommendation/rule row(s) saved.`, 'success');
  } catch (error) {
    setEditorStatus(error.message, 'error');
  }
}
