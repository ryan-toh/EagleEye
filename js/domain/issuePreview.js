import { isRequired, str } from '../utils.js';
import { tryParseConditions } from './conditions.js';

export function buildIssuePreview({
  issue,
  parameters,
  rules,
  recommendations,
}) {
  const parameterById = new Map(
    parameters.map((parameter) => [str(parameter.parameter_id), parameter]),
  );

  return {
    name: issue?.issue_name || 'Untitled issue',
    description: issue?.issue_description || 'No issue description provided.',
    parameters: parameters.map((parameter) => ({
      name: parameter.parameter_name,
      question: parameter.question_to_ask,
      required: isRequired(parameter.required),
      allowedValues: parameter.allowed_values,
    })),
    rules: rules.map((rule) => ({
      priority: rule.priority,
      recommendationId: rule.recommendation_id,
      conditions: Object.entries(tryParseConditions(rule.conditions) || {}).map(
        ([parameterId, value]) => ({
          question:
            parameterById.get(str(parameterId))?.question_to_ask || parameterId,
          value,
        }),
      ),
    })),
    recommendations,
  };
}
