import { isRequired, answerEmoji, str } from '../utils.js';
import { tryParseConditions } from './conditions.js';

export function buildQuestionPreview({
  question,
  leadingQuestions,
  rules,
  answers,
}) {
  const leadingQuestionById = new Map(
    leadingQuestions.map((leadingQuestion) => [str(leadingQuestion.leadingQuestion_id), leadingQuestion]),
  );
  const answerById = new Map(
    answers.map((answer) => [
      str(answer.answer_id),
      answer,
    ]),
  );

  return {
    name: question?.question_name || 'Untitled question',
    description: question?.question_description || 'No question description provided.',
    leadingQuestions: leadingQuestions.map((leadingQuestion) => ({
      name: leadingQuestion.leadingQuestion_name,
      question: leadingQuestion.question_to_ask,
      required: isRequired(leadingQuestion.required),
      allowedValues: leadingQuestion.allowed_values,
    })),
    rules: rules.map((rule) => ({
      priority: rule.priority,
      answerEmoji: answerEmoji(
        answerById.get(str(rule.answer_id))?.final_decision,
      ),
      conditions: Object.entries(tryParseConditions(rule.conditions) || {}).map(
        ([leadingQuestionId, value]) => ({
          question:
            leadingQuestionById.get(str(leadingQuestionId))?.question_to_ask || leadingQuestionId,
          value,
        }),
      ),
    })),
    answers,
  };
}
