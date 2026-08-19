import { str } from '../utils.js';

export function parseAllowedValues(value) {
  return str(value)
    .split(/[|;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseConditions(value) {
  const parsed =
    value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : JSON.parse(str(value));

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Rule conditions must be a JSON object.');
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([parameterId, response]) => [
      str(parameterId),
      str(response),
    ]),
  );
}

export function tryParseConditions(value) {
  try {
    return parseConditions(value);
  } catch {
    return null;
  }
}

export function serializeConditions(conditions) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(parseConditions(conditions)).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    ),
  );
}

export function conditionsEqual(first, second) {
  return serializeConditions(first) === serializeConditions(second);
}

export function referencesParameter(conditions, parameterId) {
  const parsed = tryParseConditions(conditions);
  return parsed ? Object.hasOwn(parsed, str(parameterId)) : false;
}

export function validateRuleConditions(conditions, issueId, parameters) {
  const parsed = parseConditions(conditions);
  const parametersById = new Map(
    parameters
      .filter((parameter) => str(parameter.issue_id) === str(issueId))
      .map((parameter) => [str(parameter.parameter_id), parameter]),
  );

  Object.entries(parsed).forEach(([parameterId, response]) => {
    const parameter = parametersById.get(parameterId);
    if (!parameter) {
      throw new Error(
        `Rule condition parameter_id ${parameterId} does not belong to issue_id ${issueId}.`,
      );
    }

    const allowedValues = parseAllowedValues(parameter.allowed_values);
    if (!allowedValues.includes(response)) {
      throw new Error(
        `Rule condition value "${response}" is not allowed for parameter_id ${parameterId}.`,
      );
    }
  });

  return parsed;
}
