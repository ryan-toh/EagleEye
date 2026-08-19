import { str } from '../utils.js';

export function normalizeRecommendationAssignments(assignments) {
  return assignments.map((assignment) => {
    const conditions = {};
    assignment.conditions.forEach(({ parameterId, value }) => {
      const normalizedParameterId = str(parameterId);
      const normalizedValue = str(value);
      if (!normalizedParameterId || !normalizedValue) {
        throw new Error('Choose a parameter and response for every condition.');
      }
      if (Object.hasOwn(conditions, normalizedParameterId)) {
        throw new Error(
          'Each parameter can only be used once in an assignment.',
        );
      }
      conditions[normalizedParameterId] = normalizedValue;
    });
    return { conditions, priority: assignment.priority };
  });
}
