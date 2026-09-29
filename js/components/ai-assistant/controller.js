import {
  appState,
  makeUniqueId,
  transaction,
  upsertAnswer,
  upsertLeadingQuestion,
  upsertQuestion,
  upsertRule,
  upsertTopic,
} from '../../appState.js';
import { buildDecisionGraph } from '../preview/decisionGraph.js';
import { renderMermaid } from '../preview/mermaidRenderer.js';
import { notify } from '../../ui/notifications.js';
import { setEditorTopicOptions } from '../editor/shared/controller.js';
import { parseAllowedValues } from '../../domain/conditions.js';
import { createAiClient } from '../../services/aiAssistantClient.js';
import { uiState } from '../../ui/uiState.js';
import { openDialog } from '../../ui/dialog.js';

let aiClient = createAiClient();
let assistantControlsBound = false;
let draft = null;
let mermaidDefinition = '';

export async function initAiAssistant() {
  await refreshAvailability();
  if (uiState.aiAssistantAvailable) bindAssistantControls();
}

function bindAssistantControls() {
  if (assistantControlsBound) return;
  assistantControlsBound = true;

  document.getElementById('createWithAiBtn').addEventListener('click', () => {
    populateTopicOptions();
    openDialog(document.getElementById('ai-assistant-dialog'));
  });
  const form = document.getElementById('aiDecisionTreeForm');
  form.addEventListener('submit', generateDraft);
  document
    .getElementById('acceptAiTreeBtn')
    .addEventListener('click', acceptDraft);
  document
    .getElementById('copyAiMermaidBtn')
    .addEventListener('click', copyMermaid);
}

async function refreshAvailability() {
  try {
    uiState.aiAssistantAvailable = await aiClient.isAvailable();
  } catch {
    uiState.aiAssistantAvailable = false;
  }
  document.getElementById('createWithAiBtn').disabled =
    !uiState.aiAssistantAvailable || uiState.step < 2;
}

async function generateDraft(event) {
  event.preventDefault();
  const selectedTopicId = document.getElementById('aiTopicSelect').value;
  const question = document.getElementById('aiQuestionInput').value.trim();
  const answer = document.getElementById('aiAnswerInput').value.trim();
  const generateButton = document.getElementById('generateAiTreeBtn');

  setStatus('Generating a decision-tree draft…');
  generateButton.disabled = true;
  document.getElementById('acceptAiTreeBtn').disabled = true;

  try {
    const decisionTree = JSON.parse(
      await aiClient.answer(question, { answer }),
    );
    draft = toDraftEntities(decisionTree, selectedTopicId);
    mermaidDefinition = buildDecisionGraph({
      question: draft.question,
      topicName: draft.topic.topic_name,
      leadingQuestions: draft.leadingQuestions,
      rules: draft.rules,
      answerById: new Map(draft.answers.map((item) => [item.answer_id, item])),
    });
    const result = await renderMermaid(
      document.getElementById('aiFlowchart'),
      mermaidDefinition,
    );
    if (!result.ok)
      throw new Error(
        'The draft was generated, but its graph could not be rendered.',
      );

    document.getElementById('acceptAiTreeBtn').disabled = false;
    document.getElementById('copyAiMermaidBtn').disabled = false;
    setStatus(
      'Review the draft preview, then add it when it is ready.',
      'success',
    );
  } catch (error) {
    console.error('Could not generate AI decision tree:', error);
    draft = null;
    mermaidDefinition = '';
    setStatus(
      error.message || 'Could not generate a decision-tree draft.',
      'error',
    );
  } finally {
    generateButton.disabled = false;
  }
}

function toDraftEntities(tree, selectedTopicId = '') {
  if (
    !tree?.topic?.name ||
    !tree?.question?.name ||
    !Array.isArray(tree.answers) ||
    !Array.isArray(tree.rules)
  ) {
    throw new Error('The AI service returned an incomplete decision tree.');
  }
  const selectedTopic = appState.topics.find(
    (topic) => topic.topic_id === selectedTopicId,
  );
  const topicId =
    selectedTopic?.topic_id ||
    makeUniqueId('topic', appState.topics, 'topic_id');
  const questionId = makeUniqueId(
    'question',
    appState.questions,
    'question_id',
  );
  const topic = selectedTopic || {
    topic_id: topicId,
    topic_name: tree.topic.name,
    description: tree.topic.description || '',
    example_phrases: tree.topic.example_phrases || '',
  };
  const question = {
    question_id: questionId,
    topic_id: topicId,
    question_name: tree.question.name,
    question_description: tree.question.description || '',
    example_phrases: tree.question.example_phrases || '',
  };
  const ruleValuesByName = new Map();
  tree.rules.forEach((rule) => {
    Object.entries(rule.conditions || {}).forEach(([name, value]) => {
      const key = name.toLowerCase();
      const values = ruleValuesByName.get(key) || [];
      if (!values.includes(value)) values.push(value);
      ruleValuesByName.set(key, values);
    });
  });
  const usedLeadingQuestions = [...appState.leadingQuestions];
  const leadingQuestions = tree.leading_questions.map((item, index) => {
    const allowedValues = parseAllowedValues(item.allowed_values);
    (ruleValuesByName.get(item.name.toLowerCase()) || []).forEach((value) => {
      if (!allowedValues.includes(value)) allowedValues.push(value);
    });
    const leadingQuestion = {
      question_id: questionId,
      leadingQuestion_id: makeUniqueId(
        'leadingQuestion',
        usedLeadingQuestions,
        'leadingQuestion_id',
      ),
      leadingQuestion_name: item.name,
      question_to_ask: item.question_to_ask,
      required: item.required ? 'yes' : 'no',
      allowed_values: allowedValues.join('; '),
      example_values: item.example_values || '',
      order: String(index + 1),
    };
    usedLeadingQuestions.push(leadingQuestion);
    return leadingQuestion;
  });
  const questionIdByName = new Map(
    leadingQuestions.map((item) => [
      item.leadingQuestion_name.toLowerCase(),
      item.leadingQuestion_id,
    ]),
  );
  const usedAnswers = [...appState.answers];
  const answers = tree.answers.map((item) => {
    const answer = {
      answer_id: makeUniqueId('answer', usedAnswers, 'answer_id'),
      final_decision: item.final_decision,
      answer_text: item.answer_text,
      next_steps: item.next_steps || '',
      escalation_note: item.escalation_note || '',
    };
    usedAnswers.push(answer);
    return answer;
  });
  const usedRules = [...appState.rules];
  const rules = tree.rules.map((item, index) => {
    const conditions = Object.fromEntries(
      Object.entries(item.conditions || {}).map(([name, value]) => {
        const id = questionIdByName.get(name.toLowerCase());
        if (!id)
          throw new Error(
            `The AI rule refers to an unknown leading question: ${name}.`,
          );
        return [id, value];
      }),
    );
    if (!answers[item.answer_index])
      throw new Error('The AI rule refers to an unknown answer.');
    const rule = {
      rule_id: makeUniqueId('rule', usedRules, 'rule_id'),
      question_id: questionId,
      conditions: JSON.stringify(conditions),
      answer_id: answers[item.answer_index].answer_id,
      priority: String(item.priority || index + 1),
    };
    usedRules.push(rule);
    return rule;
  });
  return {
    topic,
    usesExistingTopic: Boolean(selectedTopic),
    question,
    leadingQuestions,
    answers,
    rules,
  };
}

function populateTopicOptions() {
  const select = document.getElementById('aiTopicSelect');
  const selectedValue = select.value;
  select.replaceChildren(new Option('Let AI decide', ''));

  appState.topics.forEach((topic) => {
    select.add(new Option(topic.topic_name, topic.topic_id));
  });

  if (
    selectedValue &&
    appState.topics.some((topic) => topic.topic_id === selectedValue)
  ) {
    select.value = selectedValue;
  }
}

function acceptDraft() {
  if (!draft) return;
  try {
    transaction(() => {
      if (!draft.usesExistingTopic) upsertTopic(draft.topic);
      upsertQuestion(draft.question);
      draft.leadingQuestions.forEach(upsertLeadingQuestion);
      draft.answers.forEach(upsertAnswer);
      draft.rules.forEach(upsertRule);
    });
    setEditorTopicOptions();
    notify(
      `Added “${draft.question.question_name}”. Download all changes to export it.`,
      'success',
    );
    setStatus(
      'The approved tree has been added to your knowledge base.',
      'success',
    );
    document.getElementById('acceptAiTreeBtn').disabled = true;
    draft = null;
  } catch (error) {
    console.error('Could not add AI decision tree:', error);
    setStatus(error.message || 'Could not add the generated tree.', 'error');
  }
}

async function copyMermaid() {
  try {
    await navigator.clipboard.writeText(mermaidDefinition);
    setStatus('Mermaid copied to the clipboard.', 'success');
  } catch {
    setStatus('Clipboard access is unavailable.', 'error');
  }
}

function setStatus(message, type = '') {
  const target = document.getElementById('aiAssistantStatus');
  target.textContent = message;
  target.className = `status ${type}`.trim();
}
