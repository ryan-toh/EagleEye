import {
  appState,
  getIssueParameters,
  getIssueRules,
  getRecommendation,
  makeUniqueId,
  upsertRecommendation,
  upsertRule
} from '../../../appState.js';
import { str } from '../../../utils.js';

export function parseAllowedValues(value) {
  return str(value)
    .split(/[|;,\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function getParametersWithAllowedValues(issueId) {
  return getIssueParameters(issueId).filter(param => parseAllowedValues(param.allowed_values).length > 0);
}

export function buildParameterCombinations(issueId) {
  const parameters = getParametersWithAllowedValues(issueId);

  if (!parameters.length) {
    return [];
  }

  return cartesianProduct(parameters.map(param => {
    return parseAllowedValues(param.allowed_values).map(value => ({
      parameter_id: str(param.parameter_id),
      value
    }));
  })).map(items => {
    return Object.fromEntries(items.map(item => [item.parameter_id, item.value]));
  });
}

export function getRuleForCombination(issueId, combination) {
  const comboKey = stableConditionsKey(combination);

  return getIssueRules(issueId).find(rule => {
    const parsed = parseConditions(rule.conditions);
    return parsed && stableConditionsKey(parsed) === comboKey;
  });
}

export function getRecommendationForCombination(issueId, combination) {
  const rule = getRuleForCombination(issueId, combination);
  return rule ? getRecommendation(rule.recommendation_id) : null;
}

export function saveCombinationRecommendations(issueId, rows) {
  let savedCount = 0;

  rows.forEach((row, index) => {
    const finalDecision = str(row.final_decision);
    const recommendationText = str(row.recommendation_text);

    if (!finalDecision && !recommendationText) {
      return;
    }

    const existingRule = getRuleForCombination(issueId, row.conditions);
    const recommendationId = existingRule?.recommendation_id || makeUniqueId('REC', appState.recommendations, 'recommendation_id');
    const ruleId = existingRule?.rule_id || makeUniqueId('RULE', appState.rules, 'rule_id');

    upsertRecommendation({
      recommendation_id: recommendationId,
      final_decision: finalDecision || 'Clarify',
      recommendation_text: recommendationText || 'Clarify before giving a final recommendation.',
      next_steps: row.next_steps,
      escalation_note: row.escalation_note
    });
    
    console.log("sending to upsertRule()");
    upsertRule({
      rule_id: ruleId,
      issue_id: issueId,
      conditions: stringifyConditions(row.conditions),
      recommendation_id: recommendationId,
      priority: row.priority || index + 1
    });
    console.log("success");

    savedCount += 1;
  });

  return savedCount;
}

export function stringifyConditions(conditions) {
  return JSON.stringify(sortObjectKeys(conditions));
}

export function parseConditions(value) {
  const text = str(value);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function stableConditionsKey(conditions) {
  return stringifyConditions(conditions);
}

function sortObjectKeys(object) {
  return Object.fromEntries(
    Object.entries(object)
      .map(([key, value]) => [str(key), str(value)])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function cartesianProduct(groups) {
  return groups.reduce((acc, group) => {
    return acc.flatMap(existing => group.map(item => [...existing, item]));
  }, [[]]);
}