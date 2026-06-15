import resourcesRaw from '../data/resources.json';
import eventsRaw from '../data/events.json';
import charactersRaw from '../data/characters.json';
import endingsRaw from '../data/endings.json';
import type {
  CharacterDefinition,
  EndingDefinition,
  GameEventDefinition,
  ResourceDefinition,
} from './types';

export const resources = resourcesRaw as ResourceDefinition[];
export const events = eventsRaw as GameEventDefinition[];
export const characters = charactersRaw as CharacterDefinition[];
export const endings = endingsRaw as EndingDefinition[];
