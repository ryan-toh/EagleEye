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

  const duplicateCombination = createValidState();
  duplicateCombination.rules.push({
    ...duplicateCombination.rules[0],
    rule_id: 'DUPLICATE_RULE',
  });
  assert.throws(
    () => validateStateRelationships(duplicateCombination),
    /same parameter combination/,
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

test('workbook validation identifies the sheet, row, column, and bad format', () => {
  const workbook = { __sheetHeaders: {} };
  Object.entries(FILE_CONFIG.sheet).forEach(([key, config]) => {
    workbook.__sheetHeaders[key] = [...config.requiredColumns];
    workbook[key] = [];
  });
  workbook.issues.push({
    issue_id: 'ISSUE_001',
    topic_id: '',
    issue_name: 'Example issue',
  });

  assert.throws(
    () => validateWorkbookData(workbook),
    /Sheet "2_issues", row 2, column "topic_id" is required but is blank/,
  );

  workbook.issues[0].topic_id = 'TOPIC_001';
  workbook.topics.push({ topic_id: 'TOPIC_001', topic_name: 'Example topic' });
  workbook.parameters.push({
    issue_id: 'ISSUE_001',
    parameter_id: 'PARAM_001',
    parameter_name: 'Example parameter',
    question_to_ask: 'Example question',
    required: 'sometimes',
    order: '1',
  });

  assert.throws(
    () => validateWorkbookData(workbook),
    /Sheet "3_parameters", row 2, column "required" must be yes or no/,
  );
});

test('workbook validation allows blank optional values', () => {
  const workbook = { __sheetHeaders: {} };
  Object.entries(FILE_CONFIG.sheet).forEach(([key, config]) => {
    workbook.__sheetHeaders[key] = [...config.requiredColumns];
    workbook[key] = [];
  });
  workbook.topics.push({ topic_id: 'TOPIC_001', topic_name: 'Example topic' });
  workbook.issues.push({
    issue_id: 'ISSUE_001',
    topic_id: 'TOPIC_001',
    issue_name: 'Example issue',
  });
  workbook.parameters.push({
    issue_id: 'ISSUE_001',
    parameter_id: 'PARAM_001',
    parameter_name: 'Example parameter',
    question_to_ask: '',
    required: '',
    order: '',
  });
  workbook.recommendations.push({
    recommendation_id: 'REC_001',
    final_decision: 'Review',
    recommendation_text: '',
    next_steps: '',
  });
  workbook.rules.push({
    rule_id: 'RULE_001',
    issue_id: 'ISSUE_001',
    conditions: '{}',
    recommendation_id: 'REC_001',
    priority: '',
  });

  assert.doesNotThrow(() => validateWorkbookData(workbook));
});
