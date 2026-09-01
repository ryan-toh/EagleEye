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
- Questions
- Leading questions
- Decision Rules
- Answers

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
>
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
2. Identify the relevant question within that topic.
3. Collect only the information needed to match a decision rule.
4. Apply decision rules in priority order.
5. Return an approved answer with any required next steps or escalation notes.

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
- `2_questions` identifies specific questions under each topic.
- `3_leadingQuestionss` defines information to collect for each question.
- `4_decision_rules` defines rule conditions, priorities, and the answer assigned to each outcome.
- `5_answers` defines the approved response text, next steps, and escalation notes.

Conversation process:

1. Identify the most relevant topic from `1_topics`.
2. Identify the most relevant question under that topic from `2_questions`.
3. If multiple questions may apply, ask the user to clarify which question they mean.
4. Extract any leadingQuestions information already provided by the user.
5. Check `3_leadingQuestionss` for the selected question. Ask only for required leadingQuestionss that are missing, unclear, or outside their allowed values.
6. After each leadingQuestions response, compare the information available so far against `4_decision_rules` for the selected question. A rule may intentionally use only some leadingQuestionss.
7. If a rule is fully matched, select the matching rule with the highest priority and provide its answer without asking for leadingQuestionss that are not part of that rule. When priority is numeric, lower numbers have higher priority.
8. Use only the answer referenced by that selected rule. A answer belongs to an question only when it is assigned through a decision rule for that question.
9. Do not use answers assigned to another question, and do not provide a answer that is not supported by a matching decision rule.

Leading question handling:

- Treat `required = yes` as mandatory.
- Use `allowed_values` to normalize responses.
- If a required response does not fit the allowed values, ask the user to clarify or choose from the valid values.
- Use `example_values` and `example_phrases` only to understand intent, never as policy.
- Optional leadingQuestionss may inform the result but must not block a answer when absent.
- An question may have no leadingQuestionss. If the selected question has no required leadingQuestionss, proceed directly to evaluate its decision rules; do not ask the user for additional information unless clarification is needed to identify the question or match a rule.

Decision handling:

- Evaluate decision rules after each leadingQuestions response. A matching rule may be conclusive before every leadingQuestions is collected when its conditions do not require those leadingQuestionss.
- If multiple rules match, select the highest-priority rule.
- If no rule matches, do not force an answer. Ask a targeted clarification question or recommend escalation when the matter is sensitive, urgent, or ambiguous.
- Do not expose internal topic, question, rule, or answer IDs unless the user asks for the decision basis.

Response rules:

- Do not invent policies, requirements, procedures, or answers not supported by the uploaded XLSX file.
- Keep responses concise, professional, clear, and practical.
- When asking for missing information, list only the missing leadingQuestionss.
- When giving a final answer, include:
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
- Create and edit Questions.
- Create and edit Leading questions.
- Generate Answers.

### Visualisation

- Browse Topics and Questions.
- Preview decision trees as flowcharts.
- Automatically regenerate flowcharts when an Question is selected.

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
2. Create one or more Questions.
3. Define the required Leading questions.
4. Configure allowed values.
5. Create answer assignments for the relevant answers.
6. Create Answers.
7. Generate Decision Rules.
8. Preview the flowchart.
9. Export the workbook.
10. Upload the workbook to your chatbot.

The exported workbook contains five sheets:

```text
1_topics
2_questions
3_leadingQuestionss
4_decision_rules
5_answers
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
6. If validation succeeds, the Topics and Questions are loaded into the application.

> **Validation**
>
> If the workbook is missing a required sheet or column, EagleEye displays an error describing the problem before any data is loaded.

## Restoring from a Previous Session

Alternatively, you may restore the file you were editing previously.

### Steps

1. Open EagleEye.
2. Click **Restore Previous Session**.
3. EagleEye loads the previous Topics and Questions you were editing.

> **Saving Behaviour**
>
> EagleEye saves all data up to the last time you clicked **Save** on each topic, question, leadingQuestions or answer.


---

## Viewing a Decision Tree

Decision trees are organised by **Topic** and **Question**.

### Steps

1. Select a **Topic**.
2. Select an **Question** under that Topic.
3. EagleEye displays:

   - Leading questions
   - Decision Rules
   - Answers

4. The Preview panel automatically generates a flowchart for the selected Question.

> **Note**
>
> The flowchart is a visual representation only.
>
> The workbook remains the source of truth.

```text
topics
    ↓
questions
    ↓
leadingQuestionss
    ↓
decision rules
    ↓
answers
```

---

# Editing the Knowledge Base

## Before You Start

Different items require different selections before they can be created or edited.

| Item           | Required Selection |
| -------------- | ------------------ |
| Topic          | None               |
| Question          | Topic              |
| Leading question      | Topic + Question      |
| Answer | Topic + Question      |

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

## Questions

Questions represent specific problems or requests within a Topic.

### Create or Edit an Question

1. Select a Topic.
2. Create a new Question or open an existing one.
3. Enter:

   - **Question name**
   - Question description
   - Example phrases (optional)

4. Save the Question.

> Every Question must belong to an existing Topic.

---

## Leading Questions

Leading questions define the information the chatbot must collect before making a decision.

### Create or Edit a Leading Question

1. Select a Topic.
2. Select an Question.
3. Create or edit a Leading Question.
4. Enter:

   - **Question to ask**
   - Required (Yes/No)
   - Allowed values 
   - Example values (optional)
   - Question order

5. Save the Leading Question.

Example allowed values:

```text
low, medium, high
```

> **Required Leading questions**
>
> Leading Questions marked **required = yes** should be collected unless a fully matching decision rule can already provide a answer without them.

---

## Answers

Answers define the chatbot's final response for one or more sets of leadingQuestions answers.

### Before Creating Answers

Ensure each relevant Leading question has **allowed_values** defined.

Allowed values provide the selectable responses used when defining assignments.

---

### Create or Edit a Answer

1. Select a Topic.
2. Select an Question.
3. Create or edit a Answer.
4. Enter:

   - Final decision
   - Answer text
   - Next steps
   - Escalation note (optional)
   - One or more assignments, each containing only the relevant leadingQuestions responses
   - Optional advanced priority

> **No Leading Questions?**
>
> You may assign a answer directly to an question if you do not have any leadingQuestionss.

5. Save the Answer.

EagleEye automatically creates or updates:

- `4_decision_rules`
- `5_answers`

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
| 2        | Return the standard answer         |
| 3        | Ask the user for clarification     |

---

# Saving and Exporting

When you've finished editing:

1. Save your changes.
2. Click **Download All Changes**.

EagleEye exports the current application state into an Excel workbook containing:

```text
1_topics
2_questions
3_leadingQuestionss
4_decision_rules
5_answers
```

The exported workbook can later be uploaded back into EagleEye for further editing or attached to your chatbot.

---

# Recommended Workflow

For a new knowledge base, the recommended workflow is:

1. Create a Topic.
2. Create an Question.
3. Define the Leading questions that may be needed.
4. Configure allowed values.
5. Create answer assignments for the relevant answers.
6. Create Answers.
7. Review the generated Decision Rules.
8. Preview the flowchart.
9. Export the workbook.
10. Test the workbook with your chatbot.

Following this workflow helps ensure every Question has complete leadingQuestionss, rules, and answers before deployment.

# Developer Guide

This section describes how EagleEye is structured, how workbook data is organised, and the rules developers should follow when extending the application.

---

# Architecture

## Paradigms

- MVC-like component separation
- Imperative / procedural
- Publish–subscribe / observer

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
│   Topic, Question, Leading question and Answer editors
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
├── 2_questions
├── 3_leadingQuestionss
├── 4_decision_rules
└── 5_answers
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

## 2_questions

Stores Questions that belong to a Topic.

### Required Columns

```text
question_id
topic_id
question_name
question_description
example_phrases
```

Example

| question_id | topic_id | question_name        | question_description                      | example_phrases |
| -------- | -------- | ----------------- | -------------------------------------- | --------------- |
| I001     | T001     | Claim eligibility | Determines whether a claim may proceed | can I claim     |

> Every Question must reference an existing `topic_id`.

---

## 3_leadingQuestionss

Stores information the chatbot must collect before making a decision.

### Required Columns

```text
question_id
leadingQuestions_id
question_to_ask
required
allowed_values
example_values
order
```

Example

| question_id | leadingQuestions_id | question_to_ask       | required | allowed_values    | example_values | order |
| -------- | ------------ | --------------------- | -------- | ----------------- | -------------- | ----: |
| I001     | severity     | What is the severity? | yes      | low, medium, high | urgent         |     1 |

### Notes

- `required = yes` means the chatbot **must** collect the leadingQuestions.
- `allowed_values` defines accepted responses.
- `example_values` help interpret user input.
- `order` controls the preferred questioning sequence.

---

## 4_decision_rules

Maps leadingQuestions conditions to Answers.

### Required Columns

```text
rule_id
question_id
conditions
answer_id
priority
```

Example

| rule_id | question_id | conditions          | answer_id | priority |
| ------- | -------- | ------------------- | ----------------- | -------: |
| R001    | I001     | {"severity":"high"} | REC001            |        1 |

### Notes

- Rules are evaluated after each leadingQuestions response; a rule can match without every leadingQuestions when those leadingQuestionss are not in its conditions.
- Lower numeric priorities are evaluated first.
- If multiple rules match, the lowest priority number wins.
- Conditions should use a consistent structured format such as JSON.

---

## 5_answers

Stores approved chatbot responses.

### Required Columns

```text
answer_id
final_decision
answer_text
next_steps
escalation_note
```

Example

| answer_id | final_decision | answer_text                 | next_steps                    | escalation_note                |
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

- Every Question must belong to a Topic.
- Every Leading question must belong to an Question.
- Every Decision Rule must reference a Answer.
- Answers should not exist without a corresponding Rule unless intentionally unused.

## IDs

- Keep IDs unique.
- Keep IDs stable once published.
- Avoid reusing deleted IDs.

## Leading questions

- Use consistent `allowed_values`.
- Mark mandatory information as `required = yes`.

## Answers

- Keep answer text policy-based.
- Avoid embedding business logic inside answers.
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

## `answer_id is not defined`

Incorrect

```javascript
rules.push({
  answer_id,
});
```

Correct

```javascript
rules.push({
  answer_id: answerId,
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
| Question              | A specific problem within a Topic                                 |
| Leading question          | Information required before making a decision                     |
| Required Leading question | Information that must be collected before recommending an outcome |
| Allowed Values     | Valid responses for a Leading question                                   |
| Decision Rule      | Conditions that determine which Answer is selected        |
| Answer     | The chatbot's approved response                                   |
| Escalation         | Referral to a human or higher-level process                       |

---

# Roadmap

Planned improvements include:

- Delete Topics, Questions, Leading questions, Rules and Answers
- Rule conflict detection
- Incomplete decision tree warnings
- Import/export version metadata
- Interactive click-to-edit flowcharts
- Test conversation simulator
- TypeScript support
- Vite-based development environment

Contributions and suggestions for additional features are welcome.
