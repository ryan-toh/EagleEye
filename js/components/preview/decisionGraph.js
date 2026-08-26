import { isRequired, safeMermaidLabel, str } from '../../utils.js';
import { tryParseConditions } from '../../domain/conditions.js';

/** Builds a Mermaid definition from the selected question's decision data. */
export function buildDecisionGraph({
  question,
  topicName,
  leadingQuestions: params,
  rules: questionRules,
  answerById,
}) {
  if (!question) return 'flowchart TD\n  missing["Question not found"]';

  const rules = questionRules.map((rule) => ({
    rule,
    conditions: tryParseConditions(rule.conditions) || {},
  }));
  const lines = ['flowchart TD'];
  const nodeIds = { leadingQuestion: 0, rule: 0 };

  lines.push(
    `  start([User query]) --> questionNode["${safeMermaidLabel(
      `Topic: ${topicName}\nQuestion: ${question.question_name}`,
    )}"]`,
  );

  if (!rules.length) {
    lines.push(
      '  questionNode --> noRules["No rules defined: clarify or escalate"]',
    );
    return lines.join('\n');
  }

  appendDecisionBranch({
    parentNodeId: 'questionNode',
    edgeLabel: '',
    candidates: rules,
    remainingParams: params,
    answerById,
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
  answerById,
  nodeIds,
  lines,
}) {
  const leadingQuestion = chooseDecisionLeadingQuestion(candidates, remainingParams);
  if (!leadingQuestion) {
    appendRuleLeaves({
      parentNodeId,
      edgeLabel,
      candidates,
      answerById,
      nodeIds,
      lines,
    });
    return;
  }

  const leadingQuestionId = str(leadingQuestion.leadingQuestion_id);
  const leadingQuestionNodeId = `leadingQuestion${nodeIds.leadingQuestion++}`;
  const required = isRequired(leadingQuestion.required);
  const label = wrapFlowchartLabel(
    `${required ? 'Required' : 'Optional'}: ${leadingQuestion.leadingQuestion_name}\n${leadingQuestion.question_to_ask}`,
  );

  appendEdge(
    lines,
    parentNodeId,
    edgeLabel,
    `${leadingQuestionNodeId}{"${safeMermaidLabel(label)}"}`,
  );

  createDecisionBranches(candidates, leadingQuestionId).forEach(
    ({ label: branchLabel, candidates: matchingCandidates }) => {
      appendDecisionBranch({
        parentNodeId: leadingQuestionNodeId,
        edgeLabel: branchLabel,
        candidates: matchingCandidates,
        remainingParams: remainingParams.filter(
          (item) => str(item.leadingQuestion_id) !== leadingQuestionId,
        ),
        answerById,
        nodeIds,
        lines,
      });
    },
  );
}

function chooseDecisionLeadingQuestion(candidates, remainingParams) {
  const scored = remainingParams
    .map((leadingQuestion, index) => ({
      leadingQuestion,
      index,
      score: getLeadingQuestionSplitScore(candidates, leadingQuestion.leadingQuestion_id),
    }))
    .filter(({ score }) => score > 0);

  if (!scored.length) return null;
  scored.sort(
    (first, second) => second.score - first.score || first.index - second.index,
  );
  return scored[0].leadingQuestion;
}

function getLeadingQuestionSplitScore(candidates, leadingQuestionId) {
  const id = str(leadingQuestionId);
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

function createDecisionBranches(candidates, leadingQuestionId) {
  const id = str(leadingQuestionId);
  const candidatesWithLeadingQuestion = candidates.filter((candidate) =>
    Object.hasOwn(candidate.conditions, id),
  );
  const leadingQuestionValues = candidatesWithLeadingQuestion.map((candidate) => {
    return getCandidateValue(candidate, id);
  });
  const uniqueValues = new Set(leadingQuestionValues);
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

function getWildcardCandidates(candidates, leadingQuestionId) {
  return candidates.filter(
    (candidate) => !Object.hasOwn(candidate.conditions, leadingQuestionId),
  );
}

function getMatchingCandidates(candidates, leadingQuestionId, value) {
  return candidates.filter((candidate) => {
    const isWildcard = !Object.hasOwn(candidate.conditions, leadingQuestionId);
    const candidateValue = getCandidateValue(candidate, leadingQuestionId);

    return isWildcard || candidateValue === value;
  });
}

function getCandidateValue(candidate, leadingQuestionId) {
  return str(candidate.conditions[leadingQuestionId]) || 'Blank';
}

function appendRuleLeaves({
  parentNodeId,
  edgeLabel,
  candidates,
  answerById,
  nodeIds,
  lines,
}) {
  candidates.forEach((candidate, index) => {
    const { rule } = candidate;
    const answer = answerById.get(str(rule.answer_id));
    const decision = answer
      ? answer.final_decision
      : 'Unknown answer';
    const response = answer
      ? answer.answer_text
      : `Missing answer ${rule.answer_id}`;
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
