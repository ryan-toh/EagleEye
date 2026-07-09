import { isRequired, safeMermaidLabel, str } from '../../utils.js';
import { getIssue, getIssueParameters, getIssueRules, getRecommendationMap, getTopicName } from '../../state.js';

export function buildIssueFlowchart(issueId) {
  const issue = getIssue(issueId);
  if (!issue) return 'flowchart TD\n  missing["Issue not found"]';

  const topicName = getTopicName(issue.topic_id);
  const params = [...getIssueParameters(issueId)].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
  );
  const rules = [...getIssueRules(issueId)].sort(
    (a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0)
  );
  const recommendationById = getRecommendationMap();

  const lines = ['flowchart TD'];

  // One combined node for topic + issue
  lines.push(
    `  start([User query]) --> issueNode["${safeMermaidLabel(
      `Topic: ${topicName}\nIssue: ${issue.issue_name}`
    )}"]`
  );

  // Parameter flow: one question leads to the next on the Yes path
  lines.push('  rulesStart["Apply decision rules by priority"]');

  if (params.length === 0) {
    lines.push('  issueNode --> rulesStart');
  } else {
    params.forEach((param, index) => {
      const nodeId = `param${index}`;
      const nextNode = index === params.length - 1 ? 'rulesStart' : `param${index + 1}`;
      const required = isRequired(param.required);

      const label = `${required ? 'Required' : 'Optional'}: ${param.parameter_name}\n${param.question_to_ask}`;

      if (index === 0) {
        lines.push(`  issueNode --> ${nodeId}{"${safeMermaidLabel(label)}"}`);
      } else {
        const prevNode = `param${index - 1}`;
        lines.push(`  ${prevNode} -- Yes --> ${nodeId}`);
      }

      lines.push(`  ${nodeId} -- Yes --> ${nextNode}`);

      if (required) {
        lines.push(
          `  ${nodeId} -- No / missing --> askMissing${index}["Ask for ${safeMermaidLabel(
            param.parameter_name
          )}"]`
        );
      } else {
        lines.push(`  ${nodeId} -- No / skip --> ${nextNode}`);
      }
    });
  }

  // Rule flow: evaluate rules in priority order, one by one
  if (rules.length === 0) {
    lines.push('  rulesStart --> noRules["No rules defined: clarify or escalate"]');
  } else {
    rules.forEach((rule, index) => {
      const ruleNode = `rule${index}`;
      const rec = recommendationById.get(str(rule.recommendation_id));
      const decision = rec ? rec.final_decision : 'Unknown recommendation';

      const conditionLabel = `Priority ${rule.priority}\nIf ${rule.conditions}`;
      const recLabel = `${decision}\n${
        rec ? rec.recommendation_text : `Missing recommendation ${rule.recommendation_id}`
      }`;

      if (index === 0) {
        lines.push(`  rulesStart --> ${ruleNode}{"${safeMermaidLabel(conditionLabel)}"}`);
      } else {
        const prevRule = `rule${index - 1}`;
        lines.push(`  ${prevRule} -- No match --> ${ruleNode}{"${safeMermaidLabel(conditionLabel)}"}`);
      }

      lines.push(`  ${ruleNode} -- Match --> rec${index}["${safeMermaidLabel(recLabel)}"]`);

      if (index === rules.length - 1) {
        lines.push('  rule' + index + ' -- No match --> fallback["No clear rule match: clarify or escalate"]');
      }
    });
  }

  return lines.join('\n');
}