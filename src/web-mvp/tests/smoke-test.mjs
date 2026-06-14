import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

const EXPECTED = {
  resources: 9,
  characters: 5,
  events: 7,
  choices: 23
};

const ROUTES = [
  {
    id: 'SMOKE-STABLE',
    name: '중용 기본 흐름',
    choices: [
      'CHO-D01-001-C',
      'CHO-D02-001-B',
      'CHO-D03-001-C',
      'CHO-D04-001-B',
      'CHO-D05-001-B',
      'CHO-D06-001-A',
      'CHO-D07-001-A'
    ]
  },
  {
    id: 'SMOKE-FAMILY',
    name: '가문 우선 흐름',
    choices: [
      'CHO-D01-001-B',
      'CHO-D02-001-B',
      'CHO-D03-001-B',
      'CHO-D04-001-C',
      'CHO-D05-001-A',
      'CHO-D06-001-B',
      'CHO-D07-001-B'
    ]
  },
  {
    id: 'SMOKE-HUMAN',
    name: '인간 사회 우선 흐름',
    choices: [
      'CHO-D01-001-A',
      'CHO-D02-001-A',
      'CHO-D03-001-A',
      'CHO-D04-001-A',
      'CHO-D05-001-B',
      'CHO-D06-001-D',
      'CHO-D07-001-C'
    ]
  }
];

const RESOURCE_KEYS = {
  '혈액 재고': 'bloodStock',
  '혈액 수요': 'bloodDemand',
  '가문 자금': 'familyFund',
  '인간 신뢰': 'humanTrust',
  '언론 노출': 'mediaExposure',
  '보안 등급': 'securityLevel',
  '가문 만족도': 'familySatisfaction',
  '조직 불안': 'organizationUnrest',
  '암거래 단서': 'blackMarketClue'
};

async function loadJson(fileName) {
  const raw = await readFile(path.join(DATA_DIR, fileName), 'utf8');
  return JSON.parse(raw);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function createInitialResources(resources) {
  const state = {};
  for (const resource of resources) {
    const key = RESOURCE_KEYS[resource.name];
    assert(key, `Unknown resource name: ${resource.name}`);
    state[key] = {
      value: resource.initialValue,
      min: resource.min,
      max: resource.max
    };
  }
  return state;
}

function applyChoice(resourceState, choice) {
  for (const [key, delta] of Object.entries(choice.changes || {})) {
    assert(resourceState[key], `Choice ${choice.id} references unknown resource key: ${key}`);
    const resource = resourceState[key];
    resource.value = clamp(resource.value + Number(delta), resource.min, resource.max);
  }
}

function checkDataIntegrity({ resources, characters, events, choices }) {
  assert(resources.length === EXPECTED.resources, `Expected ${EXPECTED.resources} resources, got ${resources.length}`);
  assert(characters.length === EXPECTED.characters, `Expected ${EXPECTED.characters} characters, got ${characters.length}`);
  assert(events.length === EXPECTED.events, `Expected ${EXPECTED.events} events, got ${events.length}`);
  assert(choices.length === EXPECTED.choices, `Expected ${EXPECTED.choices} choices, got ${choices.length}`);

  const eventIds = new Set(events.map((event) => event.id));
  const choiceIds = new Set(choices.map((choice) => choice.id));

  assert(eventIds.size === events.length, 'Duplicate event id found');
  assert(choiceIds.size === choices.length, 'Duplicate choice id found');

  for (let day = 1; day <= 7; day += 1) {
    const event = events.find((item) => Number(item.day) === day);
    assert(event, `Missing event for Day ${day}`);
    const dayChoices = choices.filter((choice) => choice.eventId === event.id);
    assert(dayChoices.length >= 3, `Day ${day} has fewer than 3 choices`);
  }

  for (const choice of choices) {
    assert(eventIds.has(choice.eventId), `Choice ${choice.id} references missing event ${choice.eventId}`);
    assert(choice.text, `Choice ${choice.id} has empty text`);
    assert(choice.tone, `Choice ${choice.id} has empty tone`);
    assert(choice.resultSummary, `Choice ${choice.id} has empty result summary`);
    assert(choice.flag, `Choice ${choice.id} has empty ending flag`);
  }
}

function simulateRoute(route, resources, choices) {
  const choiceMap = new Map(choices.map((choice) => [choice.id, choice]));
  const resourceState = createInitialResources(resources);
  const flags = {};

  for (const choiceId of route.choices) {
    const choice = choiceMap.get(choiceId);
    assert(choice, `Route ${route.id} references missing choice ${choiceId}`);
    applyChoice(resourceState, choice);
    flags[choice.flag] = (flags[choice.flag] || 0) + 1;
  }

  return { resourceState, flags };
}

async function main() {
  const data = {
    resources: await loadJson('resources.json'),
    characters: await loadJson('characters.json'),
    events: await loadJson('events.json'),
    choices: await loadJson('choices.json')
  };

  checkDataIntegrity(data);

  for (const route of ROUTES) {
    const result = simulateRoute(route, data.resources, data.choices);
    const stock = result.resourceState.bloodStock.value;
    const demand = result.resourceState.bloodDemand.value;
    const diff = stock - demand;
    console.log(`[${route.id}] ${route.name}`);
    console.log(`  supply diff: ${diff}`);
    console.log(`  flags: ${JSON.stringify(result.flags)}`);
  }

  console.log('Web MVP smoke test passed.');
}

main().catch((error) => {
  console.error('Web MVP smoke test failed.');
  console.error(error);
  process.exit(1);
});
