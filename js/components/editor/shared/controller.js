import {
  clearTopicForm,
  initTopicEditor,
  setTopicOptions,
} from '../1_topic/controller.js';
import { getSelectedQuestion, initQuestionEditor } from '../2_question/controller.js';
import {
  selectTopic,
  subscribeToQuestionPreviewRefresh,
} from '../editorCoordinator.js';
import { initParamEditor } from '../3_leadingQuestion/controller.js';
import { initRecomEditor } from '../4_answerMatrix/controller.js';
import { initGlobalSearch } from '../globalSearch/controller.js';

import {
  initSharedEditorDom,
  sharedEditorDom,
  renderEditorStatus,
} from './dom.js';

import { buildDecisionGraph } from '../../preview/decisionGraph.js';
import { buildQuestionPreview } from '../../../domain/questionPreview.js';
import {
  clearQuestionView,
  setGraph,
  setQuestionSummary,
} from '../../preview/controller.js';
import { notify, subscribeToNotifications } from '../../../ui/notifications.js';

import { saveWorkbookData } from '../../../fileService.js';
import {
  getQuestion,
  getQuestionLeadingQuestions,
  getQuestionRules,
  getAnswerMap,
  getAnswersForRules,
  getTopicName,
  getWorkbookData,
} from '../../../appState.js';
import { renderStep } from '../../../ui/stepRenderer.js';
import { setStep, uiState } from '../../../ui/uiState.js';

export function initEditor() {
  initTopicEditor();
  initQuestionEditor();
  initParamEditor();
  initRecomEditor();
  initGlobalSearch();
  initSharedEditor();
}

export function initSharedEditor() {
  initSharedEditorDom();
  subscribeToNotifications(({ message, type }) =>
    setEditorStatus(message, type),
  );
  subscribeToQuestionPreviewRefresh(() => void renderSelectedQuestionPreview());

  sharedEditorDom.backToUploadsBtn.addEventListener('click', () => {
    setStep(1);
    renderStep(uiState.step);
  });
  sharedEditorDom.saveSheetBtn.addEventListener('click', saveSheet);
}

export function setEditorTopicOptions() {
  clearTopicForm();

  setTopicOptions();
  selectTopic('');
}

async function renderSelectedQuestionPreview() {
  const questionId = getSelectedQuestion();
  if (!questionId) {
    clearQuestionView();
    return;
  }

  const question = getQuestion(questionId);
  const leadingQuestions = getQuestionLeadingQuestions(questionId);
  const rules = getQuestionRules(questionId);
  const answers = getAnswersForRules(rules);
  setQuestionSummary(
    buildQuestionPreview({ question, leadingQuestions, rules, answers }),
  );

  try {
    const graphDefinition = buildDecisionGraph({
      question,
      topicName: getTopicName(question.topic_id),
      leadingQuestions,
      rules,
      answerById: getAnswerMap(),
    });
    const result = await setGraph(graphDefinition);

    if (result.stale) return;

    if (!result.ok) {
      notify(
        'Files are loaded, but Mermaid could not render the selected question',
        'error',
      );
    }
  } catch {
    notify(
      'The question summary is available, but Mermaid could not render the selected question',
      'error',
    );
  }
}

async function saveSheet() {
  await saveWorkbookData(getWorkbookData());
}

function setEditorStatus(message, type = '') {
  renderEditorStatus(message, type);
}
