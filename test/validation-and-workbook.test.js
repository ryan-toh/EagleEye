import assert from 'node:assert/strict';
import test from 'node:test';
import { validateStateRelationships } from '../js/domain/validation.js';
import { validateWorkbookData } from '../js/fileService.js';
import { FILE_CONFIG } from '../js/schema.js';

function createValidState() {
  return {
    topics: [{ topic_id: 'TOPIC' }],
    issues: [{ issue_id: 'ISSUE', topic_id: 'TOPIC' }],
    parameters: [
      { issue_id: 'ISSUE', parameter_id: 'PARAM', allowed_values: 'Yes; No' },
    ],
    rules: [
      {
        rule_id: 'RULE',
        issue_id: 'ISSUE',
        conditions: '{"PARAM":"Yes"}',
        recommendation_id: 'REC',
      },
    ],
    recommendations: [{ recommendation_id: 'REC' }],
  };
}

test('state validation catches broken relationships and collection shapes', () => {
  validateStateRelationships(createValidState());

  const orphanRule = createValidState();
  orphanRule.rules[0].issue_id = 'MISSING';
  assert.throws(
    () => validateStateRelationships(orphanRule),
    /missing issue_id/,
  );

  const malformed = createValidState();
  malformed.topics = 'not an array';
  assert.throws(
    () => validateStateRelationships(malformed),
    /topics must be an array/,
  );
});

test('workbook validation requires every configured header', () => {
  const workbook = { __sheetHeaders: {} };
  Object.entries(FILE_CONFIG.sheet).forEach(([key, config]) => {
    workbook.__sheetHeaders[key] = [...config.requiredColumns];
    workbook[key] = [];
  });

  assert.doesNotThrow(() => validateWorkbookData(workbook));
  workbook.__sheetHeaders.topics = ['topic_id'];
  assert.throws(() => validateWorkbookData(workbook), /topic_name/);
});
