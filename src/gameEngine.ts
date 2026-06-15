import { endings, events, resources } from './data';
import type {
  EndingDefinition,
  GameState,
  ResourceCondition,
  ResourceDefinition,
  ResourceDelta,
  ResourceId,
  ResourceState,
} from './types';

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

function evaluateCondition(resourcesState: ResourceState, condition: ResourceCondition): boolean {
  const current = resourcesState[condition.resourceId];

  switch (condition.operator) {
    case 'gt':
      return current > condition.value;
    case 'gte':
      return current >= condition.value;
    case 'lt':
      return current < condition.value;
    case 'lte':
      return current <= condition.value;
    case 'eq':
      return current === condition.value;
    default:
      return false;
  }
}

function matchesEnding(state: GameState, ending: EndingDefinition): boolean {
  const { all = [], any = [] } = ending.conditions;
  const allMatched = all.every((condition) => evaluateCondition(state.resources, condition));
  const anyMatched = any.length === 0 || any.some((condition) => evaluateCondition(state.resources, condition));

  return allMatched && anyMatched;
}

export function pickEnding(state: GameState): EndingDefinition {
  const sortedEndings = [...endings].sort((a, b) => b.priority - a.priority);
  const matchedEnding = sortedEndings.find((ending) => matchesEnding(state, ending));

  return matchedEnding ?? endings.find((ending) => ending.id === 'END_EXPOSED') ?? endings[0];
}

export function formatDelta(delta: ResourceDelta): string {
  const resource = resourceMap.get(delta.resourceId);
  const sign = delta.amount > 0 ? '+' : '';
  return `${resource?.name ?? delta.resourceId} ${sign}${delta.amount}`;
}
