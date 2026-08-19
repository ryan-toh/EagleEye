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
    issues: {
      sheetName: '2_issues',
      requiredColumns: ['issue_id', 'topic_id', 'issue_name'],
      exportColumns: [
        'issue_id',
        'topic_id',
        'issue_name',
        'issue_description',
        'example_phrases',
      ],
    },
    parameters: {
      sheetName: '3_parameters',
      requiredColumns: [
        'issue_id',
        'parameter_id',
        'parameter_name',
        'question_to_ask',
        'required',
        'order',
      ],
      exportColumns: [
        'issue_id',
        'parameter_id',
        'parameter_name',
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
        'issue_id',
        'conditions',
        'recommendation_id',
        'priority',
      ],
      exportColumns: [
        'rule_id',
        'issue_id',
        'conditions',
        'recommendation_id',
        'priority',
      ],
    },
    recommendations: {
      sheetName: '5_recommendations',
      requiredColumns: [
        'recommendation_id',
        'final_decision',
        'recommendation_text',
        'next_steps',
      ],
      exportColumns: [
        'recommendation_id',
        'final_decision',
        'recommendation_text',
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
    issues: [
      {
        issue_id: 'ISSUE_001',
        topic_id: 'TOPIC_001',
        issue_name: 'Sample Issue',
        issue_description: 'Example issue under the sample topic.',
        example_phrases: 'e.g., sample issue phrase',
      },
    ],
    parameters: [
      {
        issue_id: 'ISSUE_001',
        parameter_id: 'PARAM_001',
        parameter_name: 'Sample Parameter',
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
        issue_id: 'ISSUE_001',
        conditions: '{"PARAM_001":"Yes"}',
        recommendation_id: 'REC_001',
        priority: 1,
      },
      {
        rule_id: 'RULE_002',
        issue_id: 'ISSUE_001',
        conditions: '{"PARAM_001":"No"}',
        recommendation_id: 'REC_002',
        priority: 1,
      },
    ],
    recommendations: [
      {
        recommendation_id: 'REC_001',
        final_decision: 'Sample Decision 1',
        recommendation_text: 'Example recommendation text.',
        next_steps: 'Example next steps.',
        escalation_note: '',
      },
      {
        recommendation_id: 'REC_002',
        final_decision: 'Sample Decision 2',
        recommendation_text: 'Example recommendation text.',
        next_steps: 'Example next steps.',
        escalation_note: '',
      },
    ],
  };
}
