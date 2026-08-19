import { isRequired, safeMermaidLabel, str } from '../../utils.js';
import { tryParseConditions } from '../../domain/conditions.js';

/** Builds a Mermaid definition from the selected issue's decision data. */
export function buildDecisionGraph({
  issue,
  topicName,
  parameters: params,
  rules: issueRules,
  recommendationById,
}) {
  if (!issue) return 'flowchart TD\n  missing["Issue not found"]';

  const rules = issueRules.map((rule) => ({
    rule,
    conditions: tryParseConditions(rule.conditions) || {},
  }));
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

  appendDecisionBranch({
    parentNodeId: 'issueNode',
    edgeLabel: '',
    candidates: rules,
    remainingParams: params,
    recommendationById,
    nodeIds,
    lines,
  });

  return lines.join('\n');
}

function appendDecisionBranch({
  parentNodeId,
  edgeLabel,
  candidates,
  remainingParams,
  recommendationById,
  nodeIds,
  lines,
}) {
  const parameter = chooseDecisionParameter(candidates, remainingParams);
  if (!parameter) {
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

  const parameterId = str(parameter.parameter_id);
  const parameterNodeId = `parameter${nodeIds.parameter++}`;
  const required = isRequired(parameter.required);
  const label = wrapFlowchartLabel(
    `${required ? 'Required' : 'Optional'}: ${parameter.parameter_name}\n${parameter.question_to_ask}`,
  );

  appendEdge(
    lines,
    parentNodeId,
    edgeLabel,
    `${parameterNodeId}{"${safeMermaidLabel(label)}"}`,
  );

  createDecisionBranches(candidates, parameterId).forEach(
    ({ label: branchLabel, candidates: matchingCandidates }) => {
      appendDecisionBranch({
        parentNodeId: parameterNodeId,
        edgeLabel: branchLabel,
        candidates: matchingCandidates,
        remainingParams: remainingParams.filter(
          (item) => str(item.parameter_id) !== parameterId,
        ),
        recommendationById,
        nodeIds,
        lines,
      });
    },
  );
}

function chooseDecisionParameter(candidates, remainingParams) {
  const scored = remainingParams
    .map((parameter, index) => ({
      parameter,
      index,
      score: getParameterSplitScore(candidates, parameter.parameter_id),
    }))
    .filter(({ score }) => score > 0);

  if (!scored.length) return null;
  scored.sort(
    (first, second) => second.score - first.score || first.index - second.index,
  );
  return scored[0].parameter;
}

function getParameterSplitScore(candidates, parameterId) {
  const id = str(parameterId);
  const values = new Set();
  let wildcardCount = 0;

  candidates.forEach((candidate) => {
    if (Object.hasOwn(candidate.conditions, id)) {
      values.add(str(candidate.conditions[id]) || 'Blank');
    } else {
      wildcardCount += 1;
    }
  });

  if (!values.size) return 0;
  return values.size + (wildcardCount ? 1 : 0);
}

function createDecisionBranches(candidates, parameterId) {
  const id = str(parameterId);
  const candidatesWithParameter = candidates.filter((candidate) =>
    Object.hasOwn(candidate.conditions, id),
  );
  const parameterValues = candidatesWithParameter.map((candidate) => {
    return getCandidateValue(candidate, id);
  });
  const uniqueValues = new Set(parameterValues);
  const values = [...uniqueValues];
  const wildcardCandidates = getWildcardCandidates(candidates, id);
  const branches = values.map((value) => {
    const matchingCandidates = getMatchingCandidates(candidates, id, value);

    return {
      label: value,
      candidates: matchingCandidates,
    };
  });

  if (wildcardCandidates.length) {
    branches.push({ label: 'Any other value', candidates: wildcardCandidates });
  }

  return branches;
}

function getWildcardCandidates(candidates, parameterId) {
  return candidates.filter(
    (candidate) => !Object.hasOwn(candidate.conditions, parameterId),
  );
}

function getMatchingCandidates(candidates, parameterId, value) {
  return candidates.filter((candidate) => {
    const isWildcard = !Object.hasOwn(candidate.conditions, parameterId);
    const candidateValue = getCandidateValue(candidate, parameterId);

    return isWildcard || candidateValue === value;
  });
}

function getCandidateValue(candidate, parameterId) {
  return str(candidate.conditions[parameterId]) || 'Blank';
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
    const label = wrapFlowchartLabel(
      `Priority ${rule.priority}\n${decision}\n${response}`,
    );
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

function wrapFlowchartLabel(label, maximumLineLength = 28) {
  return str(label)
    .split('\n')
    .flatMap((line) => wrapLine(line, maximumLineLength))
    .join('\n');
}

function wrapLine(line, maximumLineLength) {
  const words = str(line).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const segments = word.match(new RegExp(`.{1,${maximumLineLength}}`, 'g'));

    segments.forEach((segment) => {
      const nextLine = currentLine ? `${currentLine} ${segment}` : segment;
      if (nextLine.length <= maximumLineLength) {
        currentLine = nextLine;
        return;
      }

      lines.push(currentLine);
      currentLine = segment;
    });
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}
