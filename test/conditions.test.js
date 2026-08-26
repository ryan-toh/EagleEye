import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conditionsEqual,
  parseAllowedValues,
  parseConditions,
  referencesLeadingQuestion,
  serializeConditions,
  validateRuleConditions,
} from '../js/domain/conditions.js';
import { safeMermaidLabel } from '../js/utils.js';
import { normalizeAnswerAssignments } from '../js/domain/answerAssignments.js';

test('conditions are canonicalized before comparison', () => {
  assert.equal(serializeConditions({ B: '2', A: '1' }), '{"A":"1","B":"2"}');
  assert.ok(conditionsEqual('{"A":"1","B":"2"}', { B: '2', A: '1' }));
});

test('condition helpers handle malformed input safely', () => {
  assert.throws(() => parseConditions('{"P" = "Yes"}'), SyntaxError);
  assert.equal(referencesLeadingQuestion('{"P":"Yes"}', 'P'), true);
  assert.equal(referencesLeadingQuestion('not json', 'P'), false);
  assert.deepEqual(parseAllowedValues('Yes; No|Maybe\nLater'), [
    'Yes',
    'No',
    'Maybe',
    'Later',
  ]);
});

test('rule conditions must reference an question leadingQuestion and allowed value', () => {
  const leadingQuestions = [
    { question_id: 'ISSUE_A', leadingQuestion_id: 'P', allowed_values: 'Yes; No' },
  ];

  assert.deepEqual(
    validateRuleConditions('{"P":"Yes"}', 'ISSUE_A', leadingQuestions),
    { P: 'Yes' },
  );
  assert.throws(
    () => validateRuleConditions('{"P":"Maybe"}', 'ISSUE_A', leadingQuestions),
    /not allowed/,
  );
  assert.throws(
    () => validateRuleConditions('{"OTHER":"Yes"}', 'ISSUE_A', leadingQuestions),
    /does not belong/,
  );
});

test('answer assignment validation is independent of the DOM', () => {
  assert.deepEqual(
    normalizeAnswerAssignments([
      {
        conditions: [{ leadingQuestionId: 'P', value: 'Yes' }],
        priority: '1',
      },
    ]),
    [{ conditions: { P: 'Yes' }, priority: '1' }],
  );
  assert.throws(
    () =>
      normalizeAnswerAssignments([
        {
          conditions: [
            { leadingQuestionId: 'P', value: 'Yes' },
            { leadingQuestionId: 'P', value: 'No' },
          ],
        },
      ]),
    /only be used once/,
  );
});

test('truncated Mermaid labels communicate omitted text', () => {
  const label = safeMermaidLabel('a'.repeat(200));
  assert.equal(label.length, 180);
  assert.match(label, /\.\.\.$/);
});
