const selectionEvents = new EventTarget();

export function selectTopic(topicId) {
  dispatchSelection('topic-selected', topicId);
}

export function selectQuestion(questionId) {
  dispatchSelection('question-selected', questionId);
}

export function requestQuestionPreviewRefresh() {
  dispatchSelection('question-preview-refresh');
}

export function subscribeToTopicSelection(handler) {
  return subscribeToSelection('topic-selected', handler);
}

export function subscribeToQuestionSelection(handler) {
  return subscribeToSelection('question-selected', handler);
}

export function subscribeToQuestionPreviewRefresh(handler) {
  return subscribeToSelection('question-preview-refresh', handler);
}

function dispatchSelection(type, id) {
  selectionEvents.dispatchEvent(new CustomEvent(type, { detail: id }));
}

function subscribeToSelection(type, handler) {
  const listener = (event) => handler(event.detail);
  selectionEvents.addEventListener(type, listener);

  return () => selectionEvents.removeEventListener(type, listener);
}
