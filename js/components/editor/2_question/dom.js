import {
  getQuestion,
  getQuestionsForTopic,
  makeUniqueId,
  appState,
} from '../../../appState.js';
import {
  getClickedExplorerId,
  renderExplorerEmpty,
  renderExplorerList,
  setExplorerSelectedState,
} from '../shared/explorerList.js';

export const questionEditorDom = {};

export function initQuestionEditorDom() {
  Object.assign(questionEditorDom, {
    questionId: document.getElementById('editorQuestionId'),
    questionName: document.getElementById('editorQuestionName'),
    questionDescription: document.getElementById('editorQuestionDescription'),
    questionExamples: document.getElementById('editorQuestionExamples'),
    saveQuestionBtn: document.getElementById('saveQuestionBtn'),
    createQuestionBtn: document.getElementById('createQuestionBtn'),
    questionSelect: document.getElementById('editorQuestionSelect'),
    questionList: document.getElementById('editorQuestionList'),
    questionPanelHint: document.getElementById('editorQuestionPaneHint'),
    questionDialog: document.getElementById('editorQuestionDialog'),
  });
}

/** Controller Functions */

export function setQuestionSelectedState(questionId) {
  setExplorerSelectedState(questionEditorDom.questionList, 'questionId', questionId);
}

export function renderQuestionOptions(topicId) {
  const questions = topicId ? getQuestionsForTopic(topicId) : [];
  questionEditorDom.createQuestionBtn.disabled = !topicId;

  if (!topicId) {
    questionEditorDom.questionPanelHint.textContent = 'Select a topic first';
    renderExplorerEmpty(questionEditorDom.questionList, 'Select a topic first');
    return;
  }

  questionEditorDom.questionPanelHint.textContent =
    'Create or double click on question to edit';

  renderExplorerList({
    container: questionEditorDom.questionList,
    items: questions,
    query: '',
    selectedId: questionEditorDom.questionSelect.value,
    datasetKey: 'questionId',
    getId: (question) => question.question_id,
    getTitle: (question) => question.question_name,
    getMeta: (question) => question.question_description || '',
    type: 'question',
    icon: '📄',
    emptyMessage: (allQuestions) =>
      allQuestions.length
        ? 'No questions match your search'
        : 'No questions found for this topic',
  });
}

export function getClickedQuestionId(event) {
  return getClickedExplorerId(event, 'questionId');
}

export function renderQuestionFormFor(questionId) {
  const question = questionId === '__new__' ? null : getQuestion(questionId);

  questionEditorDom.questionId.value =
    question?.question_id || makeUniqueId('ISSUE', appState.questions, 'question_id');
  questionEditorDom.questionName.value = question?.question_name || '';
  questionEditorDom.questionDescription.value = question?.question_description || '';
  questionEditorDom.questionExamples.value = question?.example_phrases || '';
}
