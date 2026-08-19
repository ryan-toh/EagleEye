import { readUiState, saveUiState } from '../persistence/localState.js';
import { str } from '../utils.js';

export const uiState = { step: 1, lastMermaid: '' };

export function loadUiState() {
  Object.assign(uiState, readUiState());
}

export function setStep(step) {
  uiState.step = Number(step) || 1;
  saveUiState(uiState);
}

export function getLastMermaid() {
  return uiState.lastMermaid;
}

export function setLastMermaid(graphDefinition) {
  uiState.lastMermaid = str(graphDefinition);
}

export function clearLastMermaid() {
  uiState.lastMermaid = '';
}
