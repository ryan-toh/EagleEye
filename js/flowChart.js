import { appState, getIssue, getIssueParameters, getIssueRules, getRecommendationMap, getTopicName } from './state.js';
import { isRequired, safeMermaidLabel, str } from './utils.js';

export function buildIssueFlowchart(issueId) {
  const issue = getIssue(issueId);
  if (!issue) return 'flowchart TD\n  missing["Issue not found"]';

  const params = getIssueParameters(issueId);
  const rules = getIssueRules(issueId);
  const recommendationById = getRecommendationMap();

  const lines = ['flowchart TD'];
  lines.push(`  start([User query]) --> topic["Topic: ${safeMermaidLabel(getTopicName(issue.topic_id))}"]`);
  lines.push(`  topic --> issue["Issue: ${safeMermaidLabel(issue.issue_name)}"]`);

  if (params.length === 0) {
    lines.push('  issue --> noParams["No parameters defined"]');
    lines.push('  noParams --> rulesStart["Apply decision rules by priority"]');
  } else {
    params.forEach((param, index) => {
      const nodeId = `param${index}`;
      const fromNode = index === 0 ? 'issue' : `param${index - 1}`;
      const requiredText = isRequired(param.required) ? 'Required' : 'Optional';
      const label = `${requiredText}: ${param.parameter_id}\n${param.question_to_ask}`;

      lines.push(`  ${fromNode} --> ${nodeId}["${safeMermaidLabel(label)}"]`);
    });

    lines.push(`  param${params.length - 1} --> ready{"All required parameters known?"}`);
    lines.push('  ready -- No --> askMissing["Ask only for missing or unclear required information"]');
    lines.push('  ready -- Yes --> rulesStart["Apply decision rules by priority"]');
  }

  if (rules.length === 0) {
    lines.push('  rulesStart --> noRules["No rules defined: clarify or escalate"]');
  } else {
    rules.forEach((rule, index) => {
      const ruleNode = `rule${index}`;
      const recNode = `rec${index}`;
      const rec = recommendationById.get(str(rule.recommendation_id));
      const decision = rec ? rec.final_decision : 'Unknown recommendation';
      const conditionLabel = `Priority ${rule.priority}\nIf ${rule.conditions}`;
      const recLabel = `${decision}\n${rec ? rec.recommendation_text : `Missing recommendation ${rule.recommendation_id}`}`;

      lines.push(`  rulesStart --> ${ruleNode}{"${safeMermaidLabel(conditionLabel)}"}`);
      lines.push(`  ${ruleNode} -- Match --> ${recNode}["${safeMermaidLabel(recLabel)}"]`);
      lines.push(`  ${ruleNode} -- No match --> continue${index}["Check next rule"]`);
    });

    lines.push('  rulesStart --> fallback["No clear rule match: clarify or escalate"]');
  }

  return lines.join('\n');
}

export async function renderMermaid(targetElement, graphDefinition) {
  appState.lastMermaid = graphDefinition;
  targetElement.classList.remove('empty');
  targetElement.innerHTML = '<div class="mermaid"></div>';

  try {
    const { svg } = await window.mermaid.render(`tree-${Date.now()}`, graphDefinition);
    targetElement.querySelector('.mermaid').innerHTML = svg;
    return { ok: true };
  } catch (error) {
    console.error(error);
    targetElement.innerHTML = `<pre>${escapeGraph(graphDefinition)}</pre><p class="status error">Mermaid could not render this chart. The raw Mermaid definition is shown above.</p>`;
    return { ok: false, error };
  }
}

function escapeGraph(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}