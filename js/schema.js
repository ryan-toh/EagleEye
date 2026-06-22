export const FILE_CONFIG = {
  topics: {
    label: '1_topics.xlsx',
    inputId: 'topicsFile',
    requiredColumns: ['topic_id', 'topic_name']
  },
  issues: {
    label: '2_issues.xlsx',
    inputId: 'issuesFile',
    requiredColumns: ['issue_id', 'topic_id', 'issue_name']
  },
  parameters: {
    label: '3_parameters.xlsx',
    inputId: 'parametersFile',
    requiredColumns: ['issue_id', 'parameter_id', 'question_to_ask', 'required', 'order']
  },
  rules: {
    label: '4_decision_rules.xlsx',
    inputId: 'rulesFile',
    requiredColumns: ['rule_id', 'issue_id', 'conditions', 'recommendation_id', 'priority']
  },
  recommendations: {
    label: '5_recommendations.xlsx',
    inputId: 'recommendationsFile',
    requiredColumns: ['recommendation_id', 'final_decision', 'recommendation_text', 'next_steps']
  }
};