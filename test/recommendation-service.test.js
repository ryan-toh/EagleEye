import assert from 'node:assert/strict';
import test from 'node:test';
import { appState } from '../js/appState.js';
import { validateAnswerAssignments } from '../js/services/answerService.js';

function setState() {
  Object.assign(appState, {
    topics: [],
    questions: [],
    leadingQuestions: [],
    answers: [],
    rules: [
      {
        rule_id: 'RULE_ONE',
        question_id: 'ISSUE_ONE',
        conditions: '{"PARAM_A":"Yes"}',
        answer_id: 'REC_ONE',
      },
    ],
  });
}

test('answer assignments cannot reuse another answer combination', () => {
  setState();
  const assignments = [
    {
      conditions: [{ leadingQuestionId: 'PARAM_A', value: 'Yes' }],
      priority: '1',
    },
  ];

  assert.throws(
    () =>
      validateAnswerAssignments('ISSUE_ONE', 'REC_TWO', assignments),
    /already assigned to another answer/,
  );
  assert.doesNotThrow(() =>
    validateAnswerAssignments('ISSUE_ONE', 'REC_ONE', assignments),
  );
});

test('answer assignments reject duplicate combinations in one save', () => {
  setState();
  const duplicateAssignments = [
    {
      conditions: [{ leadingQuestionId: 'PARAM_A', value: 'No' }],
      priority: '1',
    },
    {
      conditions: [{ leadingQuestionId: 'PARAM_A', value: 'No' }],
      priority: '2',
    },
  ];

  assert.throws(
    () =>
      validateAnswerAssignments(
        'ISSUE_ONE',
        'REC_TWO',
        duplicateAssignments,
      ),
    /only be assigned to one answer/,
  );
});
