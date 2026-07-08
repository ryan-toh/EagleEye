# Decision Tree Visualizer

A simple web application for creating, viewing, editing, validating, and exporting structured decision-support chatbot data.

The application helps maintain a rule-based chatbot knowledge base using an Excel workbook. It supports topics, issues, parameters, decision rules, and recommendations, and can visualise selected issues as flowcharts.

---

## 1. Overview

The Decision Tree Visualizer is designed for structured decision-support chatbots that need to:

1. Identify the user's broad topic.
2. Identify the specific issue under that topic.
3. Collect all required parameters before giving a recommendation.
4. Apply decision rules by priority.
5. Return an approved final response, next steps, and escalation note.

The application does **not** replace the chatbot. It helps users create and maintain the source data that the chatbot uses.

After creating an Excel workbook with this application, add this prompt to any RAG chatbot with the attached Excel file:

To make your chatbot follow a flowchart, upload the excel sheet created using EagleView with the following system prompt:

You are a structured decision-support chatbot that answers <topic> related enquiries.\
Assume the context is <topic> and do not advise the user on non-<topic> matters.

Use the uploaded CSV files as the source of truth:

1_topics.csv identifies broad query topics.\
2_issues.csv identifies specific issues under each topic.\
3_parameters.csv defines the required information that must be collected for each issue.\
4_decision_rules.csv defines the conditions for possible outcomes.\
5_recommendations.csv defines the approved final recommendation text.

Conversation process:

Identify the most relevant topic from 1_topics.csv based on the user’s query.\
Identify the most relevant issue from 2_issues.csv under that topic.\
Check 3_parameters.csv for all required parameters for the identified issue.\
Before giving any recommendation, confirm that all required parameters are available.\
If any required parameter is missing or unclear, ask the user only for the missing information.\
Once all required parameters are known, compare the user’s information against 4_decision_rules.csv.\
Select the highest-priority matching rule.\
Use 5_recommendations.csv to provide the final recommendation.\
If no rule clearly matches, ask a clarification question or recommend escalation if the issue may be sensitive, urgent, or ambiguous.

Response rules:

Do not invent policies, requirements, procedures, or recommendations that are not supported by the uploaded CSV files.\
Do not answer until all required parameters for the issue have been collected.\
If multiple issues may apply, ask the user to clarify which issue they are referring to.\
If the user provides information out of order, extract and remember the provided parameters, then ask only for the remaining missing ones.\
If the user gives vague information, ask a specific follow-up question.\
Keep responses concise and structured.\
When asking for missing parameters, list them clearly.\
When giving the final recommendation, include:\
Final decision\
Reason based on the matched rule\
Recommended next steps from 5_recommendations.csv\
Escalation note, if provided

Parameter handling:

Treat required = yes in 3_parameters.csv as mandatory.\
Use allowed_values to normalize user responses.\
Use example_values and example_phrases only to understand user intent, not as final policy.\
If a required value does not fit allowed_values, ask the user to choose or clarify.\
If a parameter is optional, use it if provided, but do not block the recommendation if it is missing.

Decision rule handling:

Apply 4_decision_rules.csv only after all required parameters are collected.\
If more than one rule matches, choose the rule with the highest priority.\
If priority is numeric, lower numbers mean higher priority.\
If no rule matches, do not force an answer; ask for clarification or escalate based on the recommendation guidance.\
Do not expose internal rule IDs unless the user asks for the basis of the decision.

Tone:

Be professional, clear, and practical.\
Avoid overly long explanations.\
Make it easy for the user to provide the missing information.


---

## 2. Main Features

Current supported features:

- Upload an Excel workbook containing decision-support data.
- Validate expected sheets and columns.
- View topics and issues.
- Visualise a selected issue as a flowchart.
- Create or edit topics.
- Create or edit issues under a selected topic.
- Create or edit parameters under a selected issue.
- Generate recommendation/rule rows from valid parameter combinations.
- Save changes into application state.
- Export the updated data back to an Excel workbook.

Deletion is not currently included.

---

## 3. Data Workbook Structure

The application expects one Excel workbook with five sheets:

```text
decision_support_knowledge_base.xlsx
├─ 1_topics
├─ 2_issues
├─ 3_parameters
├─ 4_decision_rules
└─ 5_recommendations
```

---

## 4. Sheet Schemas

### 4.1 `1_topics`

Stores broad categories of user queries.

Required columns:

```text
topic_id, topic_name, description, example_phrases
```

Example:

| topic_id | topic_name | description | example_phrases |
|---|---|---|---|
| T001 | Claims | Questions about claims handling | claim, submit claim, reimbursement |

---

### 4.2 `2_issues`

Stores specific issues under each topic.

Required columns:

```text
issue_id, topic_id, issue_name, issue_description, example_phrases
```

Each issue must belong to a topic through `topic_id`.

Example:

| issue_id | topic_id | issue_name | issue_description | example_phrases |
|---|---|---|---|---|
| I001 | T001 | Claim eligibility | Determines whether a claim may proceed | can I claim, eligible claim |

---

### 4.3 `3_parameters`

Stores the information that must be collected before a decision can be made.

Required columns:

```text
issue_id, parameter_id, question_to_ask, required, allowed_values, example_values, order
```

Example:

| issue_id | parameter_id | question_to_ask | required | allowed_values | example_values | order |
|---|---|---|---|---|---|---|
| I001 | severity | What is the severity? | yes | low, medium, high | minor, urgent | 1 |

Notes:

- `required = yes` means the chatbot must collect the parameter before giving a final recommendation.
- `allowed_values` should contain the valid values for the parameter.
- `example_values` are only examples to help interpret user input.
- `order` controls the preferred question order.

---

### 4.4 `4_decision_rules`

Stores the conditions used to select a recommendation.

Required columns:

```text
rule_id, issue_id, conditions, recommendation_id, priority
```

Example:

| rule_id | issue_id | conditions | recommendation_id | priority |
|---|---|---|---|---|
| R001 | I001 | {"severity":"high"} | REC001 | 1 |

Notes:

- Rules are applied only after all required parameters are known.
- Lower numeric priority means higher priority.
- If multiple rules match, the rule with the highest priority should be selected.
- The `conditions` field should use a consistent structured format, such as JSON.

---

### 4.5 `5_recommendations`

Stores approved final responses.

Required columns:

```text
recommendation_id, final_decision, recommendation_text, next_steps, escalation_note
```

Example:

| recommendation_id | final_decision | recommendation_text | next_steps | escalation_note |
|---|---|---|---|---|
| REC001 | Escalate | This case should be reviewed by a human officer. | Collect supporting documents. | Escalate to the relevant team. |

Recommended final decision values:

```text
Yes
No
Escalate
Clarify
```

---

## 5. Running the Application

Because the app may use JavaScript modules and HTML partials, it should be run through a local server instead of opening `index.html` directly.

From the project folder, run:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

---

## 6. Loading a Workbook

1. Open the application in the browser.
2. Go to the upload panel.
3. Select the Excel workbook.
4. Click the load button.
5. The application validates the workbook structure.
6. If valid, topics and issues are loaded into the app.

If the workbook is invalid, the app should show an error describing the missing sheet or column.

---

## 7. Viewing a Decision Tree

To view a decision tree:

1. Select a topic.
2. Select an issue under that topic.
3. The app displays the related parameters, rules, and recommendations.
4. The preview panel renders the selected issue as a flowchart.

The flowchart is generated from the workbook data. It is not the source of truth.

The source of truth is the structured workbook data:

```text
topics → issues → parameters → decision rules → recommendations
```

---

## 8. Creating or Editing a Topic

To create or edit a topic:

1. Open the editor panel.
2. Enter a `topic_id`.
3. Enter the topic name.
4. Add a description.
5. Add example phrases if useful.
6. Save the topic.

Behaviour:

- If the `topic_id` already exists, the existing topic is updated.
- If the `topic_id` does not exist, a new topic is added.

---

## 9. Creating or Editing an Issue

To create or edit an issue:

1. Select the parent topic.
2. Enter an `issue_id`.
3. Enter the issue name.
4. Add an issue description.
5. Add example phrases if useful.
6. Save the issue.

Behaviour:

- If the `issue_id` already exists, the existing issue is updated.
- If the `issue_id` does not exist, a new issue is added.
- Each issue must be linked to a valid `topic_id`.

---

## 10. Creating or Editing Parameters

To create or edit parameters:

1. Select the relevant issue.
2. Enter a `parameter_id`.
3. Enter the question that the chatbot should ask.
4. Set whether the parameter is required.
5. Enter allowed values if applicable.
6. Enter example values if useful.
7. Set the question order.
8. Save the parameter.

Example allowed values:

```text
low, medium, high
```

Behaviour:

- If the `parameter_id` already exists for the selected issue, the parameter is updated.
- If the `parameter_id` does not exist, a new parameter is added.
- Required parameters block final recommendations until they are collected.

---

## 11. Creating Rules and Recommendations

The editor can generate a recommendation matrix from valid parameter combinations.

Workflow:

1. Select a topic.
2. Select an issue.
3. Define the issue parameters.
4. Ensure relevant parameters have `allowed_values`.
5. Generate all valid parameter combinations.
6. For each combination, enter:
   - Final decision
   - Recommendation text
   - Next steps
   - Escalation note, if applicable
   - Priority
7. Save the recommendation matrix.

The app creates or updates:

- Rows in `4_decision_rules`
- Rows in `5_recommendations`

A generated condition may look like this:

```json
{"severity":"high","claim_type":"property_damage"}
```

---

## 12. Rule Priority

Rules are evaluated by priority.

```text
1 = highest priority
2 = lower priority
3 = even lower priority
```

Use priority to place exception cases before general cases.

Example:

```text
Priority 1: urgent or sensitive cases → Escalate
Priority 2: all required values valid → Yes
Priority 3: unclear values → Clarify
```

---

## 13. Saving and Exporting

After editing, export the workbook.

The export function writes the current `appState` into an Excel workbook with the expected five sheets:

```text
1_topics
2_issues
3_parameters
4_decision_rules
5_recommendations
```

Important:

- Export uses the current application state.
- If form changes are not saved into `appState`, they will not appear in the exported workbook.
- The exported workbook can be uploaded again later.

---

## 14. Recommended Editing Workflow

Use this workflow when building a new decision tree:

1. Create or select a topic.
2. Create or select an issue under that topic.
3. Define all required parameters.
4. Define allowed values for each parameter.
5. Generate parameter combinations.
6. Write recommendations for each combination.
7. Review generated decision rules.
8. Preview the flowchart.
9. Export the workbook.
10. Test the workbook with the chatbot.

---

## 15. Important Data Rules

When maintaining the decision tree:

- Do not create an issue without a valid topic.
- Do not create a parameter without a valid issue.
- Do not create a rule without a valid recommendation.
- Do not create a recommendation that is not linked from a rule unless intentionally unused.
- Use stable and unique IDs.
- Use consistent allowed values.
- Keep recommendation text approved and policy-based.
- Use escalation for sensitive, urgent, or ambiguous cases.

---

## 16. Application Architecture

Recommended high-level structure:

```text
app.js
= starts the application and initialises components

state.js
= stores shared workbook data and selected IDs

fileService.js
= loads, validates, and exports workbook data

schema.js
= defines expected sheets and columns

editor component
= handles topic, issue, parameter, rule, and recommendation editing

upload component
= handles workbook upload

preview component
= handles flowchart generation and rendering
```

The editor should update `appState`. The preview should read from `appState` and regenerate the flowchart.

---

## 17. Troubleshooting

### `mermaid is not defined`

Make sure Mermaid is loaded before your app script.

If using CDN scripts:

```html
<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script type="module" src="js/app.js"></script>
```

If using npm, import Mermaid in your JavaScript module.

---

### `Cannot use import statement outside a module`

Your script must be loaded as a module:

```html
<script type="module" src="js/app.js"></script>
```

Also run the app using a local server instead of opening the file directly.

---

### Element cannot be found after loading partials

This usually means JavaScript tried to access the element before the HTML partial was loaded.

Make sure the order is:

```text
1. DOMContentLoaded
2. await loadParts()
3. initialise DOM references
4. bind event listeners
```

Example:

```js
document.addEventListener("DOMContentLoaded", main);

async function main() {
  await loadParts();
  initDomElements();
  bindEvents();
}
```

---

### `recommendation_id is not defined`

This usually means the code used `recommendation_id` as a variable instead of an object property.

Wrong:

```js
rules.push({
  recommendation_id
});
```

Correct:

```js
rules.push({
  recommendation_id: recommendationId
});
```

---

### Workbook exports but changes are missing

Check that the editor saved the form data into `appState` before export.

The export function should write from `appState`, not directly from the form fields.

---

### HTML partials do not load

Check that the project is served over `localhost`.

This may not work reliably when opened directly using:

```text
file:///...
```

Run:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

---

## 18. Glossary

### Topic

A broad category of user queries.

### Issue

A specific problem or request under a topic.

### Parameter

A piece of information the chatbot must collect before making a recommendation.

### Required Parameter

A parameter that must be answered before the chatbot gives a final decision.

### Allowed Values

The accepted set of responses for a parameter.

### Decision Rule

A condition that maps parameter values to a recommendation.

### Recommendation

The final approved response shown to the user.

### Escalation

A case where the chatbot should refer the user to a human or higher-level process.

---

## 19. Future Improvements

Possible future features:

- Delete topics, issues, parameters, rules, and recommendations.
- Validate relationship integrity across all sheets.
- Add duplicate ID warnings.
- Add rule conflict detection.
- Add incomplete decision tree warnings.
- Add import/export version metadata.
- Add a visual click-to-edit flowchart.
- Add test conversation simulation.
- Add TypeScript support.
- Add Vite-based development setup.

