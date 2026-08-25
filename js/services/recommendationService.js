import {
  appState,
  getIssueParameters,
  getIssueRules,
  getRecommendationsForRules,
  makeUniqueId,
  removeRule,
  transaction,
  upsertRecommendation,
  upsertRule,
} from '../appState.js';
import { str } from '../utils.js';
import {
  conditionsEqual,
  parseAllowedValues,
  serializeConditions,
  tryParseConditions as parseConditions,
} from '../domain/conditions.js';
import { normalizeRecommendationAssignments } from '../domain/recommendationAssignments.js';

export { parseAllowedValues, parseConditions };

export function getParametersWithAllowedValues(issueId) {
  return getIssueParameters(issueId).filter(
    (param) => parseAllowedValues(param.allowed_values).length > 0,
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
  return getIssueRules(issueId).find((rule) => {
    const parsed = parseConditions(rule.conditions);
    return parsed && conditionsEqual(parsed, combination);
  });
}

export function saveRecommendation({
  recommendationId,
  finalDecision,
  recommendationText,
  nextSteps,
  escalationNote,
}) {
  const id = getRecommendationId(recommendationId);

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

  const normalizedAssignments = validateRecommendationAssignments(
    issueId,
    recommendationId,
    assignments,
  );

  return transaction(() => {
    const selectedKeys = getAssignmentConditionKeys(normalizedAssignments);
    let savedCount = 0;

    normalizedAssignments.forEach((assignment, index) => {
      saveRecommendationAssignment(
        issueId,
        recommendationId,
        assignment,
        index,
      );
      savedCount = index + 1;
    });

    removeUnselectedRecommendationAssignments(
      issueId,
      recommendationId,
      selectedKeys,
    );

    return savedCount;
  });
}

/** Ensures one recommendation owns each condition combination within an issue. */
export function validateRecommendationAssignments(
  issueId,
  recommendationId,
  assignments,
) {
  const normalizedAssignments = normalizeRecommendationAssignments(assignments);
  const combinationKeys = new Set();

  normalizedAssignments.forEach((assignment) => {
    const combinationKey = stringifyConditions(assignment.conditions);
    if (combinationKeys.has(combinationKey)) {
      throw new Error(
        'Each parameter combination can only be assigned to one recommendation.',
      );
    }
    combinationKeys.add(combinationKey);

    const existingRule = getRuleForCombination(issueId, assignment.conditions);
    if (
      existingRule &&
      str(existingRule.recommendation_id) !== str(recommendationId)
    ) {
      throw new Error(
        'This parameter combination is already assigned to another recommendation.',
      );
    }
  });

  return normalizedAssignments;
}

function getRecommendationId(recommendationId) {
  const existingId = str(recommendationId);
  if (existingId) return existingId;

  return makeUniqueId('REC', appState.recommendations, 'recommendation_id');
}

function getAssignmentConditionKeys(assignments) {
  const conditionKeys = assignments.map((assignment) => {
    return stringifyConditions(assignment.conditions);
  });

  return new Set(conditionKeys);
}

function saveRecommendationAssignment(
  issueId,
  recommendationId,
  assignment,
  index,
) {
  const existingRule = getRuleForCombination(issueId, assignment.conditions);
  if (
    existingRule &&
    str(existingRule.recommendation_id) !== str(recommendationId)
  ) {
    throw new Error(
      'This parameter combination is already assigned to another recommendation.',
    );
  }
  const ruleId = existingRule?.rule_id || createRuleId();
  const conditions = stringifyConditions(assignment.conditions);
  const priority = assignment.priority || index + 1;

  upsertRule({
    rule_id: ruleId,
    issue_id: issueId,
    conditions,
    recommendation_id: recommendationId,
    priority,
  });
}

function createRuleId() {
  return makeUniqueId('RULE', appState.rules, 'rule_id');
}

function removeUnselectedRecommendationAssignments(
  issueId,
  recommendationId,
  selectedKeys,
) {
  const savedRules = getRecommendationAssignments(issueId, recommendationId);

  savedRules.forEach((rule) => {
    const conditions = parseConditions(rule.conditions);
    const conditionKey = conditions && stringifyConditions(conditions);

    if (conditionKey && !selectedKeys.has(conditionKey)) {
      removeRule(rule.rule_id);
    }
  });
}

const stringifyConditions = serializeConditions;
