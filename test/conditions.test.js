import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conditionsEqual,
  parseAllowedValues,
  parseConditions,
  referencesParameter,
  serializeConditions,
  validateRuleConditions,
} from '../js/domain/conditions.js';
import { normalizeRecommendationAssignments } from '../js/domain/recommendationAssignments.js';

test('conditions are canonicalized before comparison', () => {
  assert.equal(serializeConditions({ B: '2', A: '1' }), '{"A":"1","B":"2"}');
  assert.ok(conditionsEqual('{"A":"1","B":"2"}', { B: '2', A: '1' }));
});

test('condition helpers handle malformed input safely', () => {
  assert.throws(() => parseConditions('{"P" = "Yes"}'), SyntaxError);
  assert.equal(referencesParameter('{"P":"Yes"}', 'P'), true);
  assert.equal(referencesParameter('not json', 'P'), false);
  assert.deepEqual(parseAllowedValues('Yes; No|Maybe\nLater'), [
    'Yes',
    'No',
    'Maybe',
    'Later',
  ]);
});

test('rule conditions must reference an issue parameter and allowed value', () => {
  const parameters = [
    { issue_id: 'ISSUE_A', parameter_id: 'P', allowed_values: 'Yes; No' },
  ];

  assert.deepEqual(
    validateRuleConditions('{"P":"Yes"}', 'ISSUE_A', parameters),
    { P: 'Yes' },
  );
  assert.throws(
    () => validateRuleConditions('{"P":"Maybe"}', 'ISSUE_A', parameters),
    /not allowed/,
  );
  assert.throws(
    () => validateRuleConditions('{"OTHER":"Yes"}', 'ISSUE_A', parameters),
    /does not belong/,
  );
});

test('recommendation assignment validation is independent of the DOM', () => {
  assert.deepEqual(
    normalizeRecommendationAssignments([
      {
        conditions: [{ parameterId: 'P', value: 'Yes' }],
        priority: '1',
      },
    ]),
    [{ conditions: { P: 'Yes' }, priority: '1' }],
  );
  assert.throws(
    () =>
      normalizeRecommendationAssignments([
        {
          conditions: [
            { parameterId: 'P', value: 'Yes' },
            { parameterId: 'P', value: 'No' },
          ],
        },
      ]),
    /only be used once/,
  );
});
