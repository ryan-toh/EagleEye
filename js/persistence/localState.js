const STORAGE_KEYS = [
  'topics',
  'questions',
  'leadingQuestions',
  'rules',
  'answers',
];

export function readLocalState() {
  return {
    ...Object.fromEntries(
      STORAGE_KEYS.map((key) => [key, readCollection(key)]),
    ),
  };
}

export function hasSavedDecisionTreeState() {
  return STORAGE_KEYS.every((key) => localStorage.getItem(key) !== null);
}

export function readUiState() {
  return {
    lastMermaid: localStorage.getItem('lastMermaid') || '',
    step: Number.parseInt(localStorage.getItem('step'), 10) || 1,
  };
}

function readCollection(key) {
  const savedValue = localStorage.getItem(key);
  if (savedValue === null) return [];

  try {
    return JSON.parse(savedValue);
  } catch {
    throw new Error(`Saved session data for ${key} is corrupted.`);
  }
}

export function saveDecisionTreeState(state) {
  STORAGE_KEYS.forEach((key) => saveCollection(state, key));
}

export function saveUiState(state) {
  localStorage.setItem('lastMermaid', state.lastMermaid);
  localStorage.setItem('step', String(state.step));
}

function saveCollection(state, key) {
  localStorage.setItem(key, JSON.stringify(state[key]));
}
