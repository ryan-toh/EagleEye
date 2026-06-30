// export const FILE_CONFIG = {
//   topics: {
//     label: "1_topics.xlsx",
//     inputId: "topicsFile",
//     requiredColumns: ["topic_id", "topic_name"],
//     exportColumns: [
//       "topic_id",
//       "topic_name",
//       "description",
//       "example_phrases"
//     ]
//   },

//   issues: {
//     label: "2_issues.xlsx",
//     inputId: "issuesFile",
//     requiredColumns: ["issue_id", "topic_id", "issue_name"],
//     exportColumns: [
//       "issue_id",
//       "topic_id",
//       "issue_name",
//       "issue_description",
//       "example_phrases"
//     ]
//   },

//   parameters: {
//     label: "3_parameters.xlsx",
//     inputId: "parametersFile",
//     requiredColumns: [
//       "issue_id",
//       "parameter_id",
//       "question_to_ask",
//       "required",
//       "order"
//     ],
//     exportColumns: [
//       "issue_id",
//       "parameter_id",
//       "question_to_ask",
//       "required",
//       "allowed_values",
//       "example_values",
//       "order"
//     ]
//   },

//   rules: {
//     label: "4_decision_rules.xlsx",
//     inputId: "rulesFile",
//     requiredColumns: [
//       "rule_id",
//       "issue_id",
//       "conditions",
//       "recommendation_id",
//       "priority"
//     ],
//     exportColumns: [
//       "rule_id",
//       "issue_id",
//       "conditions",
//       "recommendation_id",
//       "priority"
//     ]
//   },

//   recommendations: {
//     label: "5_recommendations.xlsx",
//     inputId: "recommendationsFile",
//     requiredColumns: [
//       "recommendation_id",
//       "final_decision",
//       "recommendation_text",
//       "next_steps"
//     ],
//     exportColumns: [
//       "recommendation_id",
//       "final_decision",
//       "recommendation_text",
//       "next_steps",
//       "escalation_note"
//     ]
//   }
// };

export const FILE_CONFIG = {
  filename: "bot-input.xlsx",
  sheet: {
    topics: {
      sheetName: "1_topics",
      requiredColumns: ["topic_id", "topic_name"],
      exportColumns: [
        "topic_id",
        "topic_name",
        "description",
        "example_phrases"
      ]
    },
    issues: {
      sheetName: "2_issues",
      requiredColumns: ["issue_id", "topic_id", "issue_name"],
      exportColumns: [
        "issue_id",
        "topic_id",
        "issue_name",
        "issue_description",
        "example_phrases"
      ]
    },
    parameters: {
      sheetName: "3_parameters",
      requiredColumns: [
        "issue_id",
        "parameter_id",
        "question_to_ask",
        "required",
        "order"
      ],
      exportColumns: [
        "issue_id",
        "parameter_id",
        "question_to_ask",
        "required",
        "allowed_values",
        "example_values",
        "order"
      ]
    },
    rules: {
      sheetName: "4_decision_rules",
      requiredColumns: [
        "rule_id",
        "issue_id",
        "conditions",
        "recommendation_id",
        "priority"
      ],
      exportColumns: [
        "rule_id",
        "issue_id",
        "conditions",
        "recommendation_id",
        "priority"
      ]
    },
    recommendations: {
      sheetName: "5_recommendations",
      requiredColumns: [
        "recommendation_id",
        "final_decision",
        "recommendation_text",
        "next_steps"
      ],
      exportColumns: [
        "recommendation_id",
        "final_decision",
        "recommendation_text",
        "next_steps",
        "escalation_note"
      ]
    }
  }
};