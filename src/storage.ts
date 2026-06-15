import { createInitialState } from './gameEngine';
import type { GameState, ResourceId, ResourceState } from './types';

const STORAGE_KEY = 'red-ledger:mvp-save:v1';
const RESOURCE_IDS: ResourceId[] = [
  'RES_BLOOD',
  'RES_FUNDS',
  'RES_PRESTIGE',
  'RES_TRUST',
  'RES_EXPOSURE',
  'RES_UNREST',
  'RES_SECURITY',
  'RES_FAMILY',
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidResourceState(value: unknown): value is ResourceState {
  if (!isObject(value)) return false;

  return RESOURCE_IDS.every((resourceId) => typeof value[resourceId] === 'number');
}

function isValidGameState(value: unknown): value is GameState {
  if (!isObject(value)) return false;

  return (
    typeof value.day === 'number' &&
    value.day >= 1 &&
    value.day <= 7 &&
    isValidResourceState(value.resources) &&
    Array.isArray(value.history) &&
    value.history.every((entry) => typeof entry === 'string')
  );
}

export function loadGameState(): GameState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  const savedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!savedValue) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(savedValue) as unknown;
    return isValidGameState(parsed) ? parsed : createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearGameState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
