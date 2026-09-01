export const FILE_CONFIG = {
  filename: 'decision-tree.xlsx',
  sheet: {
    topics: {
      sheetName: '1_topics',
      requiredColumns: ['topic_id', 'topic_name'],
      exportColumns: [
        'topic_id',
        'topic_name',
        'description',
        'example_phrases',
      ],
    },
    questions: {
      sheetName: '2_questions',
      requiredColumns: ['question_id', 'topic_id', 'question_name'],
      exportColumns: [
        'question_id',
        'topic_id',
        'question_name',
        'question_description',
        'example_phrases',
      ],
    },
    leadingQuestions: {
      sheetName: '3_leadingQuestions',
      requiredColumns: [
        'question_id',
        'leadingQuestion_id',
        'leadingQuestion_name',
        'question_to_ask',
        'required',
        'order',
      ],
      exportColumns: [
        'question_id',
        'leadingQuestion_id',
        'leadingQuestion_name',
        'question_to_ask',
        'required',
        'allowed_values',
        'example_values',
        'order',
      ],
    },
    rules: {
      sheetName: '4_decision_rules',
      requiredColumns: [
        'rule_id',
        'question_id',
        'conditions',
        'answer_id',
        'priority',
      ],
      exportColumns: [
        'rule_id',
        'question_id',
        'conditions',
        'answer_id',
        'priority',
      ],
    },
    answers: {
      sheetName: '5_answers',
      requiredColumns: [
        'answer_id',
        'final_decision',
        'answer_text',
        'next_steps',
      ],
      exportColumns: [
        'answer_id',
        'final_decision',
        'answer_text',
        'next_steps',
        'escalation_note',
      ],
    },
  },
};

export function getSampleWorkbookData() {
  return {
    topics: [
      {
        topic_id: 'TOPIC_001',
        topic_name: 'Sample Topic',
        description: 'Example topic replace with your own.',
        example_phrases: 'e.g., sample phrase one; sample phrase two',
      },
    ],
    questions: [
      {
        question_id: 'ISSUE_001',
        topic_id: 'TOPIC_001',
        question_name: 'Sample Question',
        question_description: 'Example question under the sample topic.',
        example_phrases: 'e.g., sample question phrase',
      },
    ],
    leadingQuestions: [
      {
        question_id: 'ISSUE_001',
        leadingQuestion_id: 'PARAM_001',
        leadingQuestion_name: 'Sample Leading Question',
        question_to_ask: 'Sample question to ask the user?',
        required: true,
        allowed_values: 'Yes; No',
        example_values: 'Yes',
        order: 1,
      },
    ],
    rules: [
      {
        rule_id: 'RULE_001',
        question_id: 'ISSUE_001',
        conditions: '{"PARAM_001":"Yes"}',
        answer_id: 'REC_001',
        priority: 1,
      },
      {
        rule_id: 'RULE_002',
        question_id: 'ISSUE_001',
        conditions: '{"PARAM_001":"No"}',
        answer_id: 'REC_002',
        priority: 1,
      },
    ],
    answers: [
      {
        answer_id: 'REC_001',
        final_decision: 'Sample Decision 1',
        answer_text: 'Example answer text.',
        next_steps: 'Example next steps.',
        escalation_note: '',
      },
      {
        answer_id: 'REC_002',
        final_decision: 'Sample Decision 2',
        answer_text: 'Example answer text.',
        next_steps: 'Example next steps.',
        escalation_note: '',
      },
    ],
  };
}
