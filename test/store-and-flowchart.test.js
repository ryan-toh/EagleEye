import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appState,
  loadState,
  makeUniqueId,
  removeTopic,
} from '../js/appState.js';
import { buildDecisionGraph } from '../js/components/preview/decisionGraph.js';

const writes = [];
globalThis.localStorage = {
  getItem: () => null,
  setItem: (key, value) => writes.push([key, value]),
};

function setState() {
  Object.assign(appState, {
    topics: [{ topic_id: 'TOPIC', topic_name: 'Topic' }],
    questions: [{ question_id: 'ISSUE', topic_id: 'TOPIC', question_name: 'Question' }],
    leadingQuestions: [
      {
        question_id: 'ISSUE',
        leadingQuestion_id: 'RELEVANT',
        leadingQuestion_name: 'Relevant',
        question_to_ask: 'Relevant question',
        required: 'yes',
        allowed_values: 'Yes; No',
        order: 1,
      },
      {
        question_id: 'ISSUE',
        leadingQuestion_id: 'UNUSED',
        leadingQuestion_name: 'Unused',
        question_to_ask: 'Unused question',
        required: 'yes',
        allowed_values: 'A; B',
        order: 2,
      },
    ],
    rules: [
      {
        rule_id: 'RULE_YES',
        question_id: 'ISSUE',
        conditions: '{"RELEVANT":"Yes"}',
        answer_id: 'REC_YES',
        priority: 1,
      },
      {
        rule_id: 'RULE_NO',
        question_id: 'ISSUE',
        conditions: '{"RELEVANT":"No"}',
        answer_id: 'REC_NO',
        priority: 1,
      },
    ],
    answers: [
      {
        answer_id: 'REC_YES',
        final_decision: 'Approve',
        answer_text: 'Approved',
      },
      {
        answer_id: 'REC_NO',
        final_decision: 'Decline',
        answer_text: 'Declined',
      },
    ],
  });
}

test('ID generation skips existing values', () => {
  assert.equal(
    makeUniqueId(
      'TOPIC',
      [{ topic_id: 'TOPIC_001' }, { topic_id: 'TOPIC_003' }],
      'topic_id',
    ),
    'TOPIC_004',
  );
});

test('cascade deletion persists one complete state snapshot', () => {
  setState();
  writes.length = 0;
  removeTopic('TOPIC');

  assert.deepEqual(appState.topics, []);
  assert.deepEqual(appState.questions, []);
  assert.deepEqual(appState.leadingQuestions, []);
  assert.deepEqual(appState.rules, []);
  assert.deepEqual(appState.answers, []);
  assert.equal(writes.length, 5);
});

test('loading a workbook replaces every existing state collection', () => {
  setState();
  loadState({
    topics: [{ topic_id: 'NEW_TOPIC', topic_name: 'New topic' }],
    questions: [
      {
        question_id: 'NEW_ISSUE',
        topic_id: 'NEW_TOPIC',
        question_name: 'New question',
      },
    ],
    leadingQuestions: [],
    rules: [],
    answers: [],
  });

  assert.deepEqual(
    appState.topics.map((topic) => topic.topic_id),
    ['NEW_TOPIC'],
  );
  assert.deepEqual(
    appState.questions.map((question) => question.question_id),
    ['NEW_ISSUE'],
  );
  assert.equal(appState.leadingQuestions.length, 0);
  assert.equal(appState.rules.length, 0);
  assert.equal(appState.answers.length, 0);
});

test('flowchart asks only rule-relevant questions', () => {
  setState();
  const graph = buildDecisionGraph({
    question: appState.questions[0],
    topicName: appState.topics[0].topic_name,
    leadingQuestions: appState.leadingQuestions,
    rules: appState.rules,
    answerById: new Map(
      appState.answers.map((item) => [item.answer_id, item]),
    ),
  });

  assert.match(graph, /Relevant question/);
  assert.doesNotMatch(graph, /Unused question/);
  assert.match(graph, /-- Yes -->/);
  assert.match(graph, /-- No -->/);
});
