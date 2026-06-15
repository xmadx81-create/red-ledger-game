export type ResourceId =
  | 'RES_BLOOD'
  | 'RES_FUNDS'
  | 'RES_PRESTIGE'
  | 'RES_TRUST'
  | 'RES_EXPOSURE'
  | 'RES_UNREST'
  | 'RES_SECURITY'
  | 'RES_FAMILY';

export interface ResourceDefinition {
  id: ResourceId;
  name: string;
  initial: number;
  min: number;
  max: number;
  increase: string;
  decrease: string;
  impact: string;
  ui: string;
  memo: string;
}

export interface ResourceDelta {
  resourceId: ResourceId;
  amount: number;
}

export interface GameEventChoice {
  label: string;
  textEffect: string;
  effects: ResourceDelta[];
}

export interface GameEventDefinition {
  id: string;
  day: number;
  name: string;
  condition: string;
  risk: string;
  reward: string;
  character: string;
  memo: string;
  choices: {
    A: GameEventChoice;
    B: GameEventChoice;
  };
}

export interface CharacterDefinition {
  id: string;
  name: string;
  affiliation: string;
  role: string;
  grade: string;
  loyalty: number;
  risk: number;
  ability: string;
  skill: string;
  relationship: string;
  unlock: string;
  memo: string;
}

export interface EndingDefinition {
  id: string;
  name: string;
  condition: string;
  required: string;
  forbidden: string;
  summary: string;
  unlock: string;
  priority: number;
  type: string;
  memo: string;
}

export type ResourceState = Record<ResourceId, number>;

export interface GameState {
  day: number;
  resources: ResourceState;
  history: string[];
}
