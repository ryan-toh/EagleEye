import { str } from '../utils.js';

export function normalizeAnswerAssignments(assignments) {
  return assignments.map((assignment) => {
    const conditions = {};
    assignment.conditions.forEach(({ leadingQuestionId, value }) => {
      const normalizedLeadingQuestionId = str(leadingQuestionId);
      const normalizedValue = str(value);
      if (!normalizedLeadingQuestionId || !normalizedValue) {
        throw new Error('Choose a leadingQuestion and response for every condition.');
      }
      if (Object.hasOwn(conditions, normalizedLeadingQuestionId)) {
        throw new Error(
          'Each leadingQuestion can only be used once in an assignment.',
        );
      }
      conditions[normalizedLeadingQuestionId] = normalizedValue;
    });
    return { conditions, priority: assignment.priority };
  });
}
