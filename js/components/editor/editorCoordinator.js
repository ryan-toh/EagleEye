const selectionEvents = new EventTarget();

export function selectTopic(topicId) {
  dispatchSelection('topic-selected', topicId);
}

export function selectIssue(issueId) {
  dispatchSelection('issue-selected', issueId);
}

export function requestIssuePreviewRefresh() {
  dispatchSelection('issue-preview-refresh');
}

export function subscribeToTopicSelection(handler) {
  return subscribeToSelection('topic-selected', handler);
}

export function subscribeToIssueSelection(handler) {
  return subscribeToSelection('issue-selected', handler);
}

export function subscribeToIssuePreviewRefresh(handler) {
  return subscribeToSelection('issue-preview-refresh', handler);
}

function dispatchSelection(type, id) {
  selectionEvents.dispatchEvent(new CustomEvent(type, { detail: id }));
}

function subscribeToSelection(type, handler) {
  const listener = (event) => handler(event.detail);
  selectionEvents.addEventListener(type, listener);

  return () => selectionEvents.removeEventListener(type, listener);
}
