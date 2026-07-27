import { isRequired, safeMermaidLabel, str } from '../../utils.js';
import {
  getIssue,
  getIssueParameters,
  getIssueRules,
  getRecommendationMap,
  getTopicName,
} from '../../appState.js';

export function buildIssueFlowchart(issueId) {
  const issue = getIssue(issueId);
  if (!issue) return 'flowchart TD\n  missing["Issue not found"]';

  const topicName = getTopicName(issue.topic_id);
  const params = getIssueParameters(issueId);
  const rules = getIssueRules(issueId).map((rule) => ({
    rule,
    conditions: parseConditions(rule.conditions),
  }));
  const recommendationById = getRecommendationMap();
  const lines = ['flowchart TD'];
  const nodeIds = { parameter: 0, rule: 0 };

  lines.push(
    `  start([User query]) --> issueNode["${safeMermaidLabel(
      `Topic: ${topicName}\nIssue: ${issue.issue_name}`,
    )}"]`,
  );

  if (!rules.length) {
    lines.push(
      '  issueNode --> noRules["No rules defined: clarify or escalate"]',
    );
    return lines.join('\n');
  }

  // Build a decision tree: each level asks one parameter and each rule is a leaf.
  appendParameterBranch({
    parentNodeId: 'issueNode',
    edgeLabel: '',
    candidates: rules,
    params,
    parameterIndex: 0,
    recommendationById,
    nodeIds,
    lines,
  });

  return lines.join('\n');
}

function appendParameterBranch({
  parentNodeId,
  edgeLabel,
  candidates,
  params,
  parameterIndex,
  recommendationById,
  nodeIds,
  lines,
}) {
  if (parameterIndex >= params.length) {
    appendRuleLeaves({
      parentNodeId,
      edgeLabel,
      candidates,
      recommendationById,
      nodeIds,
      lines,
    });
    return;
  }

  const parameter = params[parameterIndex];
  const parameterId = str(parameter.parameter_id);
  const parameterNodeId = `parameter${nodeIds.parameter++}`;
  const required = isRequired(parameter.required);
  const label = `${required ? 'Required' : 'Optional'}: ${parameter.parameter_name}\n${parameter.question_to_ask}`;

  appendEdge(
    lines,
    parentNodeId,
    edgeLabel,
    `${parameterNodeId}{"${safeMermaidLabel(label)}"}`,
  );

  const candidatesByValue = new Map();
  const wildcardCandidates = [];
  candidates.forEach((candidate) => {
    if (
      !Object.prototype.hasOwnProperty.call(candidate.conditions, parameterId)
    ) {
      wildcardCandidates.push(candidate);
      return;
    }

    const value = candidate.conditions[parameterId];
    const key = str(value) || 'Blank';

    if (!candidatesByValue.has(key)) candidatesByValue.set(key, []);
    candidatesByValue.get(key).push(candidate);
  });

  if (!candidatesByValue.size) {
    candidatesByValue.set('Any value', []);
  }

  candidatesByValue.forEach((matchingCandidates, value) => {
    appendParameterBranch({
      parentNodeId: parameterNodeId,
      edgeLabel: value,
      candidates: [...matchingCandidates, ...wildcardCandidates],
      params,
      parameterIndex: parameterIndex + 1,
      recommendationById,
      nodeIds,
      lines,
    });
  });
}

function appendRuleLeaves({
  parentNodeId,
  edgeLabel,
  candidates,
  recommendationById,
  nodeIds,
  lines,
}) {
  candidates.forEach((candidate, index) => {
    const { rule } = candidate;
    const recommendation = recommendationById.get(str(rule.recommendation_id));
    const decision = recommendation
      ? recommendation.final_decision
      : 'Unknown recommendation';
    const response = recommendation
      ? recommendation.recommendation_text
      : `Missing recommendation ${rule.recommendation_id}`;
    const ruleNodeId = `rule${nodeIds.rule++}`;
    const label = `Priority ${rule.priority}\n${decision}\n${response}`;
    const labelForEdge =
      candidates.length === 1 ? edgeLabel : `${edgeLabel} (rule ${index + 1})`;

    appendEdge(
      lines,
      parentNodeId,
      labelForEdge,
      `${ruleNodeId}["${safeMermaidLabel(label)}"]`,
    );
  });
}

function appendEdge(lines, from, label, to) {
  const edge = label ? ` -- ${safeMermaidLabel(label)} --> ` : ' --> ';
  lines.push(`  ${from}${edge}${to}`);
}

function parseConditions(value) {
  try {
    const parsed = JSON.parse(str(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}
