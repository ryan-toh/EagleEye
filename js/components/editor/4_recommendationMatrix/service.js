import {
  appState,
  getIssueParameters,
  getIssueRules,
  getRecommendationsForRules,
  makeUniqueId,
  removeRecommendation,
  removeRule,
  upsertRecommendation,
  upsertRule,
} from '../../../appState.js';
import { str } from '../../../utils.js';

export function parseAllowedValues(value) {
  return str(value)
    .split(/[|;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getParametersWithAllowedValues(issueId) {
  return getIssueParameters(issueId).filter(
    (param) => parseAllowedValues(param.allowed_values).length > 0,
  );
}

export function buildParameterCombinations(issueId) {
  const parameters = getParametersWithAllowedValues(issueId);
  if (!parameters.length) return [];

  return cartesianProduct(
    parameters.map((param) =>
      parseAllowedValues(param.allowed_values).map((value) => ({
        parameter_id: str(param.parameter_id),
        value,
      })),
    ),
  ).map((items) =>
    Object.fromEntries(items.map((item) => [item.parameter_id, item.value])),
  );
}

export function getRecommendations() {
  return [...appState.recommendations].sort((a, b) =>
    str(a.recommendation_id).localeCompare(str(b.recommendation_id)),
  );
}

export function getRecommendationsForIssue(issueId) {
  return getRecommendationsForRules(getIssueRules(issueId)).sort((a, b) =>
    str(a.recommendation_id).localeCompare(str(b.recommendation_id)),
  );
}

export function getRecommendationAssignments(issueId, recommendationId) {
  return getIssueRules(issueId).filter(
    (rule) => str(rule.recommendation_id) === str(recommendationId),
  );
}

export function getRuleForCombination(issueId, combination) {
  const comboKey = stringifyConditions(combination);
  return getIssueRules(issueId).find((rule) => {
    const parsed = parseConditions(rule.conditions);
    return parsed && stringifyConditions(parsed) === comboKey;
  });
}

export function saveRecommendation({
  recommendationId,
  finalDecision,
  recommendationText,
  nextSteps,
  escalationNote,
}) {
  const id =
    str(recommendationId) ||
    makeUniqueId('REC', appState.recommendations, 'recommendation_id');

  return upsertRecommendation({
    recommendation_id: id,
    final_decision: str(finalDecision) || 'Clarify',
    recommendation_text:
      str(recommendationText) ||
      'Clarify before giving a final recommendation.',
    next_steps: nextSteps,
    escalation_note: escalationNote,
  });
}

export function saveRecommendationAssignments(
  issueId,
  recommendationId,
  assignments,
) {
  if (!Array.isArray(assignments)) {
    return getRecommendationAssignments(issueId, recommendationId).length;
  }

  const selectedKeys = new Set(
    assignments
      .filter((item) => item.selected)
      .map((item) => stringifyConditions(item.conditions)),
  );
  const directRecommendationIds = new Set(getDirectRecommendationIds(issueId));
  let savedCount = 0;

  assignments
    .filter((item) => item.selected)
    .forEach((assignment, index) => {
      const existingRule = getRuleForCombination(
        issueId,
        assignment.conditions,
      );
      const ruleId =
        existingRule?.rule_id ||
        makeUniqueId('RULE', appState.rules, 'rule_id');

      upsertRule({
        rule_id: ruleId,
        issue_id: issueId,
        conditions: stringifyConditions(assignment.conditions),
        recommendation_id: recommendationId,
        priority: assignment.priority || index + 1,
      });
      savedCount += 1;
    });

  const directRule = assignments.find(
    (assignment) =>
      assignment.selected && Object.keys(assignment.conditions).length === 0,
  );
  if (directRule) {
    keepOnlyDirectRule(issueId, recommendationId, directRecommendationIds);
  }

  getRecommendationAssignments(issueId, recommendationId).forEach((rule) => {
    const parsed = parseConditions(rule.conditions);
    if (parsed && !selectedKeys.has(stringifyConditions(parsed)))
      removeRule(rule.rule_id);
  });

  return savedCount;
}

function keepOnlyDirectRule(
  issueId,
  recommendationId,
  previousRecommendationIds,
) {
  const directRules = getIssueRules(issueId).filter((rule) => {
    const conditions = parseConditions(rule.conditions);
    return conditions && Object.keys(conditions).length === 0;
  });
  const retainedRule = directRules.find(
    (rule) => str(rule.recommendation_id) === str(recommendationId),
  );

  directRules.forEach((rule) => {
    if (rule.rule_id !== retainedRule?.rule_id) {
      removeRule(rule.rule_id);
    }
  });

  [...previousRecommendationIds]
    .filter((previousId) => previousId !== str(recommendationId))
    .filter(
      (previousId) =>
        !appState.rules.some(
          (rule) => str(rule.recommendation_id) === previousId,
        ),
    )
    .forEach((previousId) => removeRecommendation(previousId));
}

function getDirectRecommendationIds(issueId) {
  return getIssueRules(issueId)
    .filter((rule) => {
      const conditions = parseConditions(rule.conditions);
      return conditions && Object.keys(conditions).length === 0;
    })
    .map((rule) => str(rule.recommendation_id));
}

export function stringifyConditions(conditions) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(conditions)
        .map(([key, value]) => [str(key), str(value)])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}

export function parseConditions(value) {
  try {
    const parsed = JSON.parse(str(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function cartesianProduct(groups) {
  return groups.reduce(
    (acc, group) =>
      acc.flatMap((existing) => group.map((item) => [...existing, item])),
    [[]],
  );
}
