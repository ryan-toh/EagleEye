if (!window.mermaid) {
  console.log("YOU SUCK");
  loadBtn.disabled = true;
}

if (!mermaid) {
  console.log("YOU SUCK ALSO");
  loadBtn.disabled = true;
}

window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

const state = {
  topics: [],
  issues: [],
  parameters: [],
  rules: [],
  recommendations: [],
  lastMermaid: ''
};

const fileInputs = {
  topics: document.getElementById('topicsFile'),
  issues: document.getElementById('issuesFile'),
  parameters: document.getElementById('parametersFile'),
  rules: document.getElementById('rulesFile'),
  recommendations: document.getElementById('recommendationsFile')
};

const loadBtn = document.getElementById('loadBtn');
const loadStatus = document.getElementById('loadStatus');
const topicSelect = document.getElementById('topicSelect');
const issueSelect = document.getElementById('issueSelect');
const parametersList = document.getElementById('parametersList');
const rulesList = document.getElementById('rulesList');
const recommendationsList = document.getElementById('recommendationsList');
const flowchart = document.getElementById('flowchart');
const copyMermaidBtn = document.getElementById('copyMermaidBtn');

loadBtn.addEventListener('click', loadAllFiles);
topicSelect.addEventListener('change', onTopicChange);
issueSelect.addEventListener('change', onIssueChange);
copyMermaidBtn.addEventListener('click', copyMermaid);

async function loadAllFiles() {
  setStatus('Loading files...', '');

  try {
    validateFilesPresent();

    state.topics = await readXlsx(fileInputs.topics.files[0]);
    state.issues = await readXlsx(fileInputs.issues.files[0]);
    state.parameters = await readXlsx(fileInputs.parameters.files[0]);
    state.rules = await readXlsx(fileInputs.rules.files[0]);
    state.recommendations = await readXlsx(fileInputs.recommendations.files[0]);

    validateRequiredColumns('1_topics.xlsx', state.topics, ['topic_id', 'topic_name']);
    validateRequiredColumns('2_issues.xlsx', state.issues, ['issue_id', 'topic_id', 'issue_name']);
    validateRequiredColumns('3_parameters.xlsx', state.parameters, ['issue_id', 'parameter_id', 'question_to_ask', 'required', 'order']);
    validateRequiredColumns('4_decision_rules.xlsx', state.rules, ['rule_id', 'issue_id', 'conditions', 'recommendation_id', 'priority']);
    validateRequiredColumns('5_recommendations.xlsx', state.recommendations, ['recommendation_id', 'final_decision', 'recommendation_text', 'next_steps']);

    populateTopics();
    setStatus('Files loaded successfully.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to load files.', 'error');
  }
}

function validateFilesPresent() {
  const missing = Object.entries(fileInputs)
    .filter(([, input]) => !input.files || input.files.length === 0)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing file(s): ${missing.join(', ')}`);
  }
}

function readXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        resolve(rows.map(normalizeRowKeys));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRowKeys(row) {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[String(key).trim()] = typeof value === 'string' ? value.trim() : value;
  });
  return normalized;
}

function validateRequiredColumns(fileName, rows, columns) {
  if (!rows.length) throw new Error(`${fileName} has no data rows.`);

  const rowColumns = Object.keys(rows[0]);
  const missing = columns.filter(col => !rowColumns.includes(col));

  if (missing.length) {
    throw new Error(`${fileName} is missing column(s): ${missing.join(', ')}`);
  }
}

function populateTopics() {
  topicSelect.innerHTML = '<option value="">Select a topic</option>';

  state.topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = str(topic.topic_id);
    option.textContent = `${topic.topic_name} (${topic.topic_id})`;
    topicSelect.appendChild(option);
  });

  topicSelect.disabled = false;
  issueSelect.disabled = true;
  issueSelect.innerHTML = '<option value="">Select a topic first</option>';
  clearIssueView();
}

function onTopicChange() {
  const topicId = topicSelect.value;
  const issues = state.issues.filter(issue => str(issue.topic_id) === topicId);

  issueSelect.innerHTML = '<option value="">Select an issue</option>';
  issues.forEach(issue => {
    const option = document.createElement('option');
    option.value = str(issue.issue_id);
    option.textContent = `${issue.issue_name} (${issue.issue_id})`;
    issueSelect.appendChild(option);
  });

  issueSelect.disabled = !topicId;
  clearIssueView();
}

function onIssueChange() {
  const issueId = issueSelect.value;
  if (!issueId) {
    clearIssueView();
    return;
  }

  renderIssueSummary(issueId);
  renderFlowchart(issueId);
}

function renderIssueSummary(issueId) {
  const issueParameters = getIssueParameters(issueId);
  const issueRules = getIssueRules(issueId);
  const issueRecommendationIds = new Set(issueRules.map(rule => str(rule.recommendation_id)));
  const issueRecommendations = state.recommendations.filter(rec => issueRecommendationIds.has(str(rec.recommendation_id)));

  parametersList.classList.remove('empty');
  parametersList.innerHTML = toList(issueParameters, param => {
    const required = isRequired(param.required);
    return `
      <strong>${escapeHtml(param.parameter_id)}</strong>
      <span class="badge ${required ? 'required' : 'optional'}">${required ? 'required' : 'optional'}</span><br />
      ${escapeHtml(param.question_to_ask)}
      ${param.allowed_values ? `<br /><small>Allowed: ${escapeHtml(param.allowed_values)}</small>` : ''}
    `;
  });

  rulesList.classList.remove('empty');
  rulesList.innerHTML = toList(issueRules, rule => `
    <strong>Priority ${escapeHtml(rule.priority)}</strong><br />
    ${escapeHtml(rule.conditions)}<br />
    <small>Recommendation: ${escapeHtml(rule.recommendation_id)}</small>
  `);

  recommendationsList.classList.remove('empty');
  recommendationsList.innerHTML = toList(issueRecommendations, rec => `
    <strong>${escapeHtml(rec.final_decision)}</strong><br />
    ${escapeHtml(rec.recommendation_text)}
    ${rec.next_steps ? `<br /><small>Next steps: ${escapeHtml(rec.next_steps)}</small>` : ''}
    ${rec.escalation_note ? `<br /><small>Escalation: ${escapeHtml(rec.escalation_note)}</small>` : ''}
  `);
}

async function renderFlowchart(issueId) {
  const issue = state.issues.find(item => str(item.issue_id) === issueId);
  const params = getIssueParameters(issueId);
  const rules = getIssueRules(issueId);
  const recommendationById = new Map(state.recommendations.map(rec => [str(rec.recommendation_id), rec]));

  const lines = ['flowchart TD'];
  lines.push(`  start([User query]) --> topic["Topic: ${safeMermaidLabel(getTopicName(issue.topic_id))}"]`);
  lines.push(`  topic --> issue["Issue: ${safeMermaidLabel(issue.issue_name)}"]`);

  if (params.length === 0) {
    lines.push('  issue --> noParams["No parameters defined"]');
  } else {
    params.forEach((param, index) => {
      const nodeId = `param${index}`;
      const nextId = index === params.length - 1 ? 'ready' : `param${index + 1}`;
      const requiredText = isRequired(param.required) ? 'Required' : 'Optional';
      const label = `${requiredText}: ${param.parameter_id}\n${param.question_to_ask}`;
      lines.push(`  ${index === 0 ? 'issue' : `param${index - 1}`} --> ${nodeId}["${safeMermaidLabel(label)}"]`);
      if (index === params.length - 1) lines.push(`  ${nodeId} --> ready{"All required parameters known?"}`);
    });
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
    lines.push(`  rulesStart --> fallback["No clear rule match: clarify or escalate"]`);
  }

  const graphDefinition = lines.join('\n');
  state.lastMermaid = graphDefinition;

  flowchart.classList.remove('empty');
  flowchart.innerHTML = '<div class="mermaid"></div>';
  const mermaidDiv = flowchart.querySelector('.mermaid');

  try {
    const { svg } = await mermaid.render(`tree-${Date.now()}`, graphDefinition);
    mermaidDiv.innerHTML = svg;
    copyMermaidBtn.disabled = false;
  } catch (error) {
    console.error(error);
    flowchart.innerHTML = `<pre>${escapeHtml(graphDefinition)}</pre><p class="status error">Mermaid could not render this chart. The raw Mermaid definition is shown above.</p>`;
    copyMermaidBtn.disabled = false;
  }
}

function getIssueParameters(issueId) {
  return state.parameters
    .filter(param => str(param.issue_id) === issueId)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

function getIssueRules(issueId) {
  return state.rules
    .filter(rule => str(rule.issue_id) === issueId)
    .sort((a, b) => Number(a.priority || 999999) - Number(b.priority || 999999));
}

function getTopicName(topicId) {
  const topic = state.topics.find(item => str(item.topic_id) === str(topicId));
  return topic ? topic.topic_name : topicId;
}

function isRequired(value) {
  return ['yes', 'y', 'true', 'required', '1'].includes(str(value).toLowerCase());
}

function toList(items, renderer) {
  if (!items.length) return '<p class="empty">None found for this issue.</p>';
  return `<ul>${items.map(item => `<li>${renderer(item)}</li>`).join('')}</ul>`;
}

function clearIssueView() {
  parametersList.className = 'empty';
  parametersList.textContent = 'No issue selected.';
  rulesList.className = 'empty';
  rulesList.textContent = 'No issue selected.';
  recommendationsList.className = 'empty';
  recommendationsList.textContent = 'No issue selected.';
  flowchart.className = 'flowchart empty';
  flowchart.textContent = 'Load files and select an issue.';
  copyMermaidBtn.disabled = true;
  state.lastMermaid = '';
}

async function copyMermaid() {
  if (!state.lastMermaid) return;
  await navigator.clipboard.writeText(state.lastMermaid);
  copyMermaidBtn.textContent = 'Copied';
  setTimeout(() => (copyMermaidBtn.textContent = 'Copy Mermaid'), 1200);
}

function setStatus(message, type) {
  loadStatus.textContent = message;
  loadStatus.className = `status ${type}`.trim();
}

function str(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function escapeHtml(value) {
  return str(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeMermaidLabel(value) {
  return str(value)
    .replaceAll('"', "'")
    .replaceAll('[', '(')
    .replaceAll(']', ')')
    .replaceAll('{', '(')
    .replaceAll('}', ')')
    .replaceAll('|', '-')
    .slice(0, 180);
}