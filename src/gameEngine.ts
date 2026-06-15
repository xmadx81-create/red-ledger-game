import { endings, events, resources } from './data';
import type { EndingDefinition, GameState, ResourceDefinition, ResourceDelta, ResourceId, ResourceState } from './types';

const resourceMap = new Map<ResourceId, ResourceDefinition>(
  resources.map((resource) => [resource.id, resource] as const),
);

export function createInitialState(): GameState {
  const initialResources = resources.reduce((acc, resource) => {
    acc[resource.id] = resource.initial;
    return acc;
  }, {} as ResourceState);

  return {
    day: 1,
    resources: initialResources,
    history: ['1일차 운영을 시작했습니다.'],
  };
}

export function clampResourceValue(resourceId: ResourceId, value: number): number {
  const definition = resourceMap.get(resourceId);
  if (!definition) return value;
  return Math.min(definition.max, Math.max(definition.min, value));
}

export function applyDeltas(state: GameState, deltas: ResourceDelta[], label: string): GameState {
  const nextResources = { ...state.resources };

  for (const delta of deltas) {
    const current = nextResources[delta.resourceId] ?? 0;
    nextResources[delta.resourceId] = clampResourceValue(delta.resourceId, current + delta.amount);
  }

  return {
    ...state,
    resources: nextResources,
    history: [...state.history, `${state.day}일차 선택: ${label}`],
  };
}

export function getCurrentEvent(state: GameState) {
  return events.find((event) => event.day === state.day) ?? events[events.length - 1];
}

export function chooseOption(state: GameState, option: 'A' | 'B'): GameState {
  const currentEvent = getCurrentEvent(state);
  const choice = currentEvent.choices[option];
  const updatedState = applyDeltas(state, choice.effects, choice.label);

  return {
    ...updatedState,
    day: Math.min(7, state.day + 1),
  };
}

export function isFinalDayComplete(state: GameState): boolean {
  return state.history.length >= 8;
}

export function pickEnding(state: GameState): EndingDefinition {
  const r = state.resources;

  if (r.RES_UNREST >= 85 || r.RES_BLOOD <= 5) {
    return endings.find((ending) => ending.id === 'END_COLLAPSE') ?? endings[0];
  }

  if (r.RES_EXPOSURE >= 80 || r.RES_TRUST <= 10) {
    return endings.find((ending) => ending.id === 'END_EXPOSED') ?? endings[0];
  }

  if (r.RES_FAMILY >= 75 && r.RES_PRESTIGE >= 70 && r.RES_TRUST >= 20) {
    return endings.find((ending) => ending.id === 'END_FAMILY') ?? endings[0];
  }

  if (r.RES_TRUST >= 75 && r.RES_EXPOSURE < 25 && r.RES_FAMILY >= 25) {
    return endings.find((ending) => ending.id === 'END_PUBLIC') ?? endings[0];
  }

  if (r.RES_BLOOD >= 40 && r.RES_TRUST >= 45 && r.RES_EXPOSURE < 50 && r.RES_FAMILY >= 45) {
    return endings.find((ending) => ending.id === 'END_BALANCED') ?? endings[0];
  }

  return endings.find((ending) => ending.id === 'END_EXPOSED') ?? endings[0];
}

export function formatDelta(delta: ResourceDelta): string {
  const resource = resourceMap.get(delta.resourceId);
  const sign = delta.amount > 0 ? '+' : '';
  return `${resource?.name ?? delta.resourceId} ${sign}${delta.amount}`;
}
