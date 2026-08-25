import assert from 'node:assert/strict';
import test from 'node:test';
import { appState } from '../js/appState.js';
import { validateRecommendationAssignments } from '../js/services/recommendationService.js';

function setState() {
  Object.assign(appState, {
    topics: [],
    issues: [],
    parameters: [],
    recommendations: [],
    rules: [
      {
        rule_id: 'RULE_ONE',
        issue_id: 'ISSUE_ONE',
        conditions: '{"PARAM_A":"Yes"}',
        recommendation_id: 'REC_ONE',
      },
    ],
  });
}

test('recommendation assignments cannot reuse another recommendation combination', () => {
  setState();
  const assignments = [
    {
      conditions: [{ parameterId: 'PARAM_A', value: 'Yes' }],
      priority: '1',
    },
  ];

  assert.throws(
    () =>
      validateRecommendationAssignments('ISSUE_ONE', 'REC_TWO', assignments),
    /already assigned to another recommendation/,
  );
  assert.doesNotThrow(() =>
    validateRecommendationAssignments('ISSUE_ONE', 'REC_ONE', assignments),
  );
});

test('recommendation assignments reject duplicate combinations in one save', () => {
  setState();
  const duplicateAssignments = [
    {
      conditions: [{ parameterId: 'PARAM_A', value: 'No' }],
      priority: '1',
    },
    {
      conditions: [{ parameterId: 'PARAM_A', value: 'No' }],
      priority: '2',
    },
  ];

  assert.throws(
    () =>
      validateRecommendationAssignments(
        'ISSUE_ONE',
        'REC_TWO',
        duplicateAssignments,
      ),
    /only be assigned to one recommendation/,
  );
});
