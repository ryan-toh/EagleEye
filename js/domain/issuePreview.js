import { isRequired, recommendationEmoji, str } from '../utils.js';
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
  const recommendationById = new Map(
    recommendations.map((recommendation) => [
      str(recommendation.recommendation_id),
      recommendation,
    ]),
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
      recommendationEmoji: recommendationEmoji(
        recommendationById.get(str(rule.recommendation_id))?.final_decision,
      ),
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
