import assert from 'node:assert/strict';
import test from 'node:test';
import { appState, makeUniqueId, removeTopic } from '../js/appState.js';
import { buildDecisionGraph } from '../js/components/preview/decisionGraph.js';

const writes = [];
globalThis.localStorage = {
  getItem: () => null,
  setItem: (key, value) => writes.push([key, value]),
};

function setState() {
  Object.assign(appState, {
    topics: [{ topic_id: 'TOPIC', topic_name: 'Topic' }],
    issues: [{ issue_id: 'ISSUE', topic_id: 'TOPIC', issue_name: 'Issue' }],
    parameters: [
      {
        issue_id: 'ISSUE',
        parameter_id: 'RELEVANT',
        parameter_name: 'Relevant',
        question_to_ask: 'Relevant question',
        required: 'yes',
        allowed_values: 'Yes; No',
        order: 1,
      },
      {
        issue_id: 'ISSUE',
        parameter_id: 'UNUSED',
        parameter_name: 'Unused',
        question_to_ask: 'Unused question',
        required: 'yes',
        allowed_values: 'A; B',
        order: 2,
      },
    ],
    rules: [
      {
        rule_id: 'RULE_YES',
        issue_id: 'ISSUE',
        conditions: '{"RELEVANT":"Yes"}',
        recommendation_id: 'REC_YES',
        priority: 1,
      },
      {
        rule_id: 'RULE_NO',
        issue_id: 'ISSUE',
        conditions: '{"RELEVANT":"No"}',
        recommendation_id: 'REC_NO',
        priority: 1,
      },
    ],
    recommendations: [
      {
        recommendation_id: 'REC_YES',
        final_decision: 'Approve',
        recommendation_text: 'Approved',
      },
      {
        recommendation_id: 'REC_NO',
        final_decision: 'Decline',
        recommendation_text: 'Declined',
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
  assert.deepEqual(appState.issues, []);
  assert.deepEqual(appState.parameters, []);
  assert.deepEqual(appState.rules, []);
  assert.deepEqual(appState.recommendations, []);
  assert.equal(writes.length, 5);
});

test('flowchart asks only rule-relevant questions', () => {
  setState();
  const graph = buildDecisionGraph({
    issue: appState.issues[0],
    topicName: appState.topics[0].topic_name,
    parameters: appState.parameters,
    rules: appState.rules,
    recommendationById: new Map(
      appState.recommendations.map((item) => [item.recommendation_id, item]),
    ),
  });

  assert.match(graph, /Relevant question/);
  assert.doesNotMatch(graph, /Unused question/);
  assert.match(graph, /-- Yes -->/);
  assert.match(graph, /-- No -->/);
});
