# EagleEye

> A web application for creating, viewing, editing, validating, and exporting structured decision-support chatbot knowledge bases.

This guide was put together by a human.

---

# Table of Contents

- [Introduction](#introduction)
- [User Guide](#user-guide)

  - [Getting Started](#getting-started)
  - [Creating a Chatbot](#creating-a-chatbot)
  - [Features](#features)

- [Developer Guide](#developer-guide)

---

# Introduction

## What is EagleEye?

EagleEye is a web application for building and maintaining structured decision-support chatbot knowledge bases.

Instead of manually creating complex decision trees, EagleEye allows you to define chatbot behaviour using a structured Excel workbook consisting of:

- Topics
- Issues
- Parameters
- Decision Rules
- Recommendations

The workbook becomes the source of truth for a rule-based chatbot.

EagleEye itself is **not** the chatbot. It is an authoring tool used to create and maintain the chatbot's knowledge base.

---

## Who is this guide for?

Choose the section that best matches your needs:

### Users

You're in the right place if you want to:

- Build a structured decision-support chatbot.
- Create or edit chatbot knowledge bases.
- Visualise decision flows.
- Export chatbot data for use with a RAG or rule-based chatbot.

### Developers

The Developer Guide includes:

- Application architecture
- Workbook schema
- Data rules
- Troubleshooting
- Future improvements

---

# User Guide

## Getting Started

### Option 1: COMET / GSIB Users (Windows)

Installation is not required.

To use EagleEye:

1. Go to https://eagle.cio.sandbox.gov.sg.
2. Download a template workbook if you're creating a new chatbot.
3. Assign an appropriate security classification to the template if required.
4. Upload either:

   - the template workbook, or
   - an existing decision tree workbook.

5. Click **Continue**.
6. Create, edit, explore, or delete decision trees.
7. When finished, click **Download All Changes** to export the updated workbook.

---

### Option 2: Local Installation

#### Prerequisites

- Python 3

#### Installation

1. Clone this repository.
2. Open your preferred terminal.
3. Start a local web server.

**macOS**

```bash
python3 -m http.server 3000
```

**Windows**

```bash
python -m http.server 3000
```

> **Note** \
> If port 3000 is in use, try running on another port (e.g. 5050).
> ```bash
> python -m http.server 5050
> ```

4. If Python is not installed, install it first.

---

#### Running EagleEye

1. Open:

```
http://localhost:3000
```

2. Download a template workbook if creating a new chatbot.
3. Upload either:

   - the template workbook, or
   - an existing workbook.

4. Click **Continue**.
5. Edit your knowledge base.
6. Click **Download All Changes** to export the updated workbook.

---

## What Can EagleEye Be Used For?

EagleEye is designed for structured decision-support chatbots that need to:

1. Identify the user's broad topic.
2. Identify the relevant issue within that topic.
3. Collect all required information.
4. Apply decision rules in priority order.
5. Return an approved recommendation with any required next steps or escalation notes.

Typical use cases include:

- Internal policy assistants
- Claims processing
- HR decision support
- Government services
- Compliance guidance
- Operational playbooks

---

## Creating a Chatbot

> **Note**
>
> EagleEye creates and maintains the workbook. Your chatbot uses the workbook as its source of truth.

After exporting a workbook from EagleEye, attach the workbook to your chatbot and provide the following system prompt below.

```
You are a structured decision-support chatbot that answers <your topic here>-related enquiries. Assume the context is <your topic here> and do not advise on non-<your topic here> matters.

Use the uploaded XLSX file as the sole source of truth:

- `1_topics` identifies broad query topics.
- `2_issues` identifies specific issues under each topic.
- `3_parameters` defines information to collect for each issue.
- `4_decision_rules` defines rule conditions, priorities, and the recommendation assigned to each outcome.
- `5_recommendations` defines the approved response text, next steps, and escalation notes.

Conversation process:

1. Identify the most relevant topic from `1_topics`.
2. Identify the most relevant issue under that topic from `2_issues`.
3. If multiple issues may apply, ask the user to clarify which issue they mean.
4. Extract any parameter information already provided by the user.
5. Check `3_parameters` for the selected issue. Ask only for required parameters that are missing, unclear, or outside their allowed values.
6. Once all required parameters are known, compare the information against `4_decision_rules` for the selected issue.
7. Select the matching rule with the highest priority. When priority is numeric, lower numbers have higher priority.
8. Use only the recommendation referenced by that selected rule. A recommendation belongs to an issue only when it is assigned through a decision rule for that issue.
9. Do not use recommendations assigned to another issue, and do not provide a recommendation that is not supported by a matching decision rule.

Parameter handling:

- Treat `required = yes` as mandatory.
- Use `allowed_values` to normalize responses.
- If a required response does not fit the allowed values, ask the user to clarify or choose from the valid values.
- Use `example_values` and `example_phrases` only to understand intent, never as policy.
- Optional parameters may inform the result but must not block a recommendation when absent.
- An issue may have no parameters. If the selected issue has no required parameters, proceed directly to evaluate its decision rules; do not ask the user for additional information unless clarification is needed to identify the issue or match a rule.

Decision handling:

- Apply decision rules only after all required parameters are collected.
- If multiple rules match, select the highest-priority rule.
- If no rule matches, do not force an answer. Ask a targeted clarification question or recommend escalation when the matter is sensitive, urgent, or ambiguous.
- Do not expose internal topic, issue, rule, or recommendation IDs unless the user asks for the decision basis.

Response rules:

- Do not invent policies, requirements, procedures, or recommendations not supported by the uploaded XLSX file.
- Keep responses concise, professional, clear, and practical.
- When asking for missing information, list only the missing parameters.
- When giving a final recommendation, include:
  - Final decision
  - Reason based on the matched rule
  - Recommended next steps
  - Escalation note, if provided
```

---

# Features

## Current Features (v0.9)

### Workbook Management

- Upload an Excel workbook.
- Validate workbook structure.
- Export updated workbooks.

### Knowledge Base Editing

- Create and edit Topics.
- Create and edit Issues.
- Create and edit Parameters.
- Generate Recommendations.

### Visualisation

- Browse Topics and Issues.
- Preview decision trees as flowcharts.
- Automatically regenerate flowcharts when an Issue is selected.

---

## Planned Features

- Rule conflict detection.
- Incomplete decision tree warnings.
- Import/export version metadata.
- Click-to-edit flowcharts.
- TypeScript support.
- Vite development environment.

---

## Typical Workflow

A typical EagleEye workflow is:

1. Create a Topic.
2. Create one or more Issues.
3. Define the required Parameters.
4. Configure allowed values.
5. Generate parameter combinations.
6. Create Recommendations.
7. Generate Decision Rules.
8. Preview the flowchart.
9. Export the workbook.
10. Upload the workbook to your chatbot.

The exported workbook contains five sheets:

```text
1_topics
2_issues
3_parameters
4_decision_rules
5_recommendations
```

These sheets form the chatbot's complete decision-support knowledge base.

# Working with Knowledge Bases

## Loading a Workbook

Before you can edit a knowledge base, you must load an Excel workbook.

### Steps

1. Open EagleEye.
2. Go to the **Upload** panel.
3. Select an Excel workbook.
4. Click **Load**.
5. EagleEye validates the workbook structure.
6. If validation succeeds, the Topics and Issues are loaded into the application.

> **Validation**
>
> If the workbook is missing a required sheet or column, EagleEye displays an error describing the problem before any data is loaded.

## Restoring from a Previous Session

Alternatively, you may restore the file you were editing previously.

### Steps

1. Open EagleEye.
2. Click **Restore Previous Session**.
3. EagleEye loads the previous Topics and Issues you were editing.

> **Saving Behaviour**
>
> EagleEye saves all data up to the last time you clicked **Save** on each topic, issue, parameter or recommendation.


---

## Viewing a Decision Tree

Decision trees are organised by **Topic** and **Issue**.

### Steps

1. Select a **Topic**.
2. Select an **Issue** under that Topic.
3. EagleEye displays:

   - Parameters
   - Decision Rules
   - Recommendations

4. The Preview panel automatically generates a flowchart for the selected Issue.

> **Note**
>
> The flowchart is a visual representation only.
>
> The workbook remains the source of truth.

```text
topics
    ↓
issues
    ↓
parameters
    ↓
decision rules
    ↓
recommendations
```

---

# Editing the Knowledge Base

## Before You Start

Different items require different selections before they can be created or edited.

| Item           | Required Selection |
| -------------- | ------------------ |
| Topic          | None               |
| Issue          | Topic              |
| Parameter      | Topic + Issue      |
| Recommendation | Topic + Issue      |

You can either:

- Click **+** to create a new item.
- Double-click an existing item to edit it.

---

## Topics

Topics are broad categories of user enquiries.

### Create or Edit a Topic

1. Click the **+** button in the Topics panel, or double-click an existing Topic.
2. Enter:

   - Topic name
   - Description
   - Example phrases (optional)

3. Save the Topic.

---

## Issues

Issues represent specific problems or requests within a Topic.

### Create or Edit an Issue

1. Select a Topic.
2. Create a new Issue or open an existing one.
3. Enter:

   - **Issue name**
   - Issue description
   - Example phrases (optional)

4. Save the Issue.

> Every Issue must belong to an existing Topic.

---

## Parameters

Parameters define the information the chatbot must collect before making a decision.

### Create or Edit a Parameter

1. Select a Topic.
2. Select an Issue.
3. Create or edit a Parameter.
4. Enter:

   - **Question to ask**
   - Required (Yes/No)
   - Allowed values 
   - Example values (optional)
   - Question order

5. Save the Parameter.

Example allowed values:

```text
low, medium, high
```

> **Required Parameters**
>
> Parameters marked **required = yes** must be collected before the chatbot can provide a recommendation.

---

## Recommendations

Recommendations define the chatbot's final response for one or more combinations of parameter values.

### Before Creating Recommendations

Ensure each relevant Parameter has **allowed_values** defined.

Without allowed values, EagleEye cannot generate parameter combinations.

---

### Create or Edit a Recommendation

1. Select a Topic.
2. Select an Issue.
3. Create or edit a Recommendation.
4. Enter:

   - Final decision
   - Recommendation text
   - Next steps
   - Escalation note (optional)
   - Priority
   - Applicable parameter combinations 

> **No Parameter Recommendations**
>
> You may assign a recommendation directly to an issue if you do not have any parameters.

5. Save the Recommendation.

EagleEye automatically creates or updates:

- `4_decision_rules`
- `5_recommendations`

Example generated condition:

```json
{
  "severity": "high",
  "claim_type": "property_damage"
}
```

---

## Rule Priority

When multiple Decision Rules match, EagleEye evaluates them by priority.

```text
1 = Highest priority
2 = Lower priority
3 = Lowest priority
```

Lower numbers always take precedence.

Example:

| Priority | Behaviour                          |
| -------- | ---------------------------------- |
| 1        | Escalate urgent or sensitive cases |
| 2        | Return the standard recommendation |
| 3        | Ask the user for clarification     |

---

# Saving and Exporting

When you've finished editing:

1. Save your changes.
2. Click **Download All Changes**.

EagleEye exports the current application state into an Excel workbook containing:

```text
1_topics
2_issues
3_parameters
4_decision_rules
5_recommendations
```

The exported workbook can later be uploaded back into EagleEye for further editing or attached to your chatbot.

---

# Recommended Workflow

For a new knowledge base, the recommended workflow is:

1. Create a Topic.
2. Create an Issue.
3. Define all required Parameters.
4. Configure allowed values.
5. Generate parameter combinations.
6. Create Recommendations.
7. Review the generated Decision Rules.
8. Preview the flowchart.
9. Export the workbook.
10. Test the workbook with your chatbot.

Following this workflow helps ensure every Issue has complete parameters, rules, and recommendations before deployment.

# Developer Guide

This section describes how EagleEye is structured, how workbook data is organised, and the rules developers should follow when extending the application.

---

# Architecture

## High Level Overview

```text
app.js
│
├── state.js
│   Shared application state
│
├── fileService.js
│   Workbook import, validation and export
│
├── schema.js
│   Workbook schemas and validation rules
│
├── upload/
│   Workbook upload UI
│
├── editor/
│   Topic, Issue, Parameter and Recommendation editors
│
└── preview/
    Flowchart generation and rendering
```

### Component Responsibilities

| Component        | Responsibility                                          |
| ---------------- | ------------------------------------------------------- |
| `app.js`         | Starts the application and initialises components       |
| `state.js`       | Stores the shared application state                     |
| `fileService.js` | Loads, validates and exports Excel workbooks            |
| `schema.js`      | Defines workbook structure and required columns         |
| `upload`         | Handles workbook upload                                 |
| `editor`         | Creates and edits workbook data                         |
| `preview`        | Generates flowcharts from the current application state |

> **Important**
>
> The editor should update `appState`.
>
> The preview should always render directly from `appState`.

---

# Workbook Structure

EagleEye stores chatbot knowledge in a single Excel workbook.

```text
decision_support_knowledge_base.xlsx
├── 1_topics
├── 2_issues
├── 3_parameters
├── 4_decision_rules
└── 5_recommendations
```

These five sheets together form the chatbot's knowledge base.

---

# Sheet Schemas

## 1_topics

Stores the high level categories of user enquiries.

### Required Columns

```text
topic_id
topic_name
description
example_phrases
```

Example

| topic_id | topic_name | description                     | example_phrases      |
| -------- | ---------- | ------------------------------- | -------------------- |
| T001     | Claims     | Questions about claims handling | claim, reimbursement |

---

## 2_issues

Stores Issues that belong to a Topic.

### Required Columns

```text
issue_id
topic_id
issue_name
issue_description
example_phrases
```

Example

| issue_id | topic_id | issue_name        | issue_description                      | example_phrases |
| -------- | -------- | ----------------- | -------------------------------------- | --------------- |
| I001     | T001     | Claim eligibility | Determines whether a claim may proceed | can I claim     |

> Every Issue must reference an existing `topic_id`.

---

## 3_parameters

Stores information the chatbot must collect before making a decision.

### Required Columns

```text
issue_id
parameter_id
question_to_ask
required
allowed_values
example_values
order
```

Example

| issue_id | parameter_id | question_to_ask       | required | allowed_values    | example_values | order |
| -------- | ------------ | --------------------- | -------- | ----------------- | -------------- | ----: |
| I001     | severity     | What is the severity? | yes      | low, medium, high | urgent         |     1 |

### Notes

- `required = yes` means the chatbot **must** collect the parameter.
- `allowed_values` defines accepted responses.
- `example_values` help interpret user input.
- `order` controls the preferred questioning sequence.

---

## 4_decision_rules

Maps parameter conditions to Recommendations.

### Required Columns

```text
rule_id
issue_id
conditions
recommendation_id
priority
```

Example

| rule_id | issue_id | conditions          | recommendation_id | priority |
| ------- | -------- | ------------------- | ----------------- | -------: |
| R001    | I001     | {"severity":"high"} | REC001            |        1 |

### Notes

- Rules are evaluated only after all required parameters are collected.
- Lower numeric priorities are evaluated first.
- If multiple rules match, the lowest priority number wins.
- Conditions should use a consistent structured format such as JSON.

---

## 5_recommendations

Stores approved chatbot responses.

### Required Columns

```text
recommendation_id
final_decision
recommendation_text
next_steps
escalation_note
```

Example

| recommendation_id | final_decision | recommendation_text                 | next_steps                    | escalation_note                |
| ----------------- | -------------- | ----------------------------------- | ----------------------------- | ------------------------------ |
| REC001            | Escalate       | Refer this case to a human officer. | Collect supporting documents. | Escalate to the relevant team. |

Recommended values for `final_decision`:

```text
Answered
Unanswered
Clarify
Escalate
```

---

# Data Rules

When modifying a knowledge base, follow these rules.

## Relationships

- Every Issue must belong to a Topic.
- Every Parameter must belong to an Issue.
- Every Decision Rule must reference a Recommendation.
- Recommendations should not exist without a corresponding Rule unless intentionally unused.

## IDs

- Keep IDs unique.
- Keep IDs stable once published.
- Avoid reusing deleted IDs.

## Parameters

- Use consistent `allowed_values`.
- Mark mandatory information as `required = yes`.

## Recommendations

- Keep recommendation text policy-based.
- Avoid embedding business logic inside recommendations.
- Use escalation for sensitive, urgent or ambiguous cases.

---

# Troubleshooting

## `mermaid is not defined`

Mermaid must be loaded before the application script.


### npm

Import Mermaid into your JavaScript module before use.

---

## `Cannot use import statement outside a module`

Load the application as an ES module.

```html
<script type="module" src="js/app.js"></script>
```

Also ensure the application is served through a local web server rather than opening `index.html` directly.

---

## Elements Cannot Be Found After Loading Partials

This usually means JavaScript attempted to access DOM elements before the HTML partials had finished loading.

Recommended order:

```text
1. DOMContentLoaded
2. await loadParts()
3. Initialise DOM references
4. Bind event listeners
```

Example

```javascript
document.addEventListener('DOMContentLoaded', main);

async function main() {
  await loadParts();
  initDomElements();
  bindEvents();
}
```

---

## `recommendation_id is not defined`

Incorrect

```javascript
rules.push({
  recommendation_id,
});
```

Correct

```javascript
rules.push({
  recommendation_id: recommendationId,
});
```

---

## Workbook Exports Without Recent Changes

Verify that the editor updates `appState` before export.

The export service should always write workbook data from `appState`, not directly from form controls.

---

# Glossary

| Term               | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| Topic              | A broad category of user enquiries                                |
| Issue              | A specific problem within a Topic                                 |
| Parameter          | Information required before making a decision                     |
| Required Parameter | Information that must be collected before recommending an outcome |
| Allowed Values     | Valid responses for a Parameter                                   |
| Decision Rule      | Conditions that determine which Recommendation is selected        |
| Recommendation     | The chatbot's approved response                                   |
| Escalation         | Referral to a human or higher-level process                       |

---

# Roadmap

Planned improvements include:

- Delete Topics, Issues, Parameters, Rules and Recommendations
- Rule conflict detection
- Incomplete decision tree warnings
- Import/export version metadata
- Interactive click-to-edit flowcharts
- Test conversation simulator
- TypeScript support
- Vite-based development environment

Contributions and suggestions for additional features are welcome.
