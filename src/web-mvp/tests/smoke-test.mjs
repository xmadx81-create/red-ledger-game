import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const WEB_DIR = path.resolve(__dirname, '..');

const EXPECTED = {
  resources: 9,
  characters: 5,
  events: 7,
  choices: 23,
  combatBriefings: 4,
  combatActions: 10,
  combatTypes: 6,
  combatResultMeters: 5,
  combatRanks: 5
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
    name: '후원 우선 흐름',
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
    name: '시민 신뢰 우선 흐름',
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

function checkDataIntegrity({ resources, characters, events, choices, combatBriefings, combatActions, combatTypes, combatResultRules }) {
  assert(resources.length === EXPECTED.resources, `Expected ${EXPECTED.resources} resources, got ${resources.length}`);
  assert(characters.length === EXPECTED.characters, `Expected ${EXPECTED.characters} characters, got ${characters.length}`);
  assert(events.length === EXPECTED.events, `Expected ${EXPECTED.events} events, got ${events.length}`);
  assert(choices.length === EXPECTED.choices, `Expected ${EXPECTED.choices} choices, got ${choices.length}`);
  assert(combatBriefings.length === EXPECTED.combatBriefings, `Expected ${EXPECTED.combatBriefings} combat briefings, got ${combatBriefings.length}`);
  assert(combatActions.length === EXPECTED.combatActions, `Expected ${EXPECTED.combatActions} combat actions, got ${combatActions.length}`);
  assert(combatTypes.length === EXPECTED.combatTypes, `Expected ${EXPECTED.combatTypes} combat types, got ${combatTypes.length}`);
  assert(combatResultRules.resultMeters.length === EXPECTED.combatResultMeters, `Expected ${EXPECTED.combatResultMeters} combat result meters, got ${combatResultRules.resultMeters.length}`);
  assert(combatResultRules.rankRules.length === EXPECTED.combatRanks, `Expected ${EXPECTED.combatRanks} combat ranks, got ${combatResultRules.rankRules.length}`);

  const eventIds = new Set(events.map((event) => event.id));
  const choiceIds = new Set(choices.map((choice) => choice.id));
  const combatTypeIds = new Set(combatTypes.map((item) => item.combatTypeId));
  const combatActionNames = new Set(combatActions.map((item) => item.name));
  const combatActionIds = new Set(combatActions.map((item) => item.actionId));

  assert(eventIds.size === events.length, 'Duplicate event id found');
  assert(choiceIds.size === choices.length, 'Duplicate choice id found');
  assert(combatTypeIds.size === combatTypes.length, 'Duplicate combat type id found');
  assert(combatActionIds.size === combatActions.length, 'Duplicate combat action id found');

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
    assert(choice.flag, `Choice ${choice.id} has empty progression flag`);
  }

  for (const action of combatActions) {
    assert(action.actionId, 'Combat action has empty id');
    assert(action.name, `Combat action ${action.actionId} has empty name`);
    assert(action.description, `Combat action ${action.actionId} has empty description`);
  }

  for (const briefing of combatBriefings) {
    assert(combatTypeIds.has(briefing.combatTypeId), `Briefing ${briefing.briefingId} references missing combat type ${briefing.combatTypeId}`);
    assert(briefing.title, `Briefing ${briefing.briefingId} has empty title`);
    assert(briefing.summary, `Briefing ${briefing.briefingId} has empty summary`);
    assert(Array.isArray(briefing.preferredActions), `Briefing ${briefing.briefingId} has invalid preferred actions`);
    for (const actionName of briefing.preferredActions) {
      assert(combatActionNames.has(actionName), `Briefing ${briefing.briefingId} references missing action ${actionName}`);
    }
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

// ---- 전체 데이터 JSON 파싱 (문법 회귀 방지) ----
async function checkAllJson() {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  for (const f of files) await loadJson(f);
  console.log(`데이터 JSON ${files.length}개 파싱 통과.`);
}

// ---- 카드게임 데이터 정합성 ----
const CARD_UID_RE = /^CARD-(.+)-(N|R|SR|EP|L)-(\d{4})$/;
async function checkCardGameData() {
  const style = await loadJson('card-style-system.json');
  const grades = style.rarityTiers.map((t) => t.rarityId);
  assert(grades.join(',') === 'N,R,SR,EP,L', `등급 사다리 불일치: ${grades}`);
  const validRar = new Set(grades);

  const reg = await loadJson('character-card-registry.json');
  const seen = new Set();
  for (const c of reg.cards) {
    assert(CARD_UID_RE.test(c.cardUid), `cardUid 형식 오류 ${c.cardUid}`);
    assert(!seen.has(c.cardUid), `cardUid 중복 ${c.cardUid}`);
    seen.add(c.cardUid);
    assert(validRar.has(c.rarity), `rarity 무효 ${c.cardUid}`);
    assert(reg.statusTypes.includes(c.status), `status 무효 ${c.cardUid}`);
  }

  const tree = await loadJson('fusion-recipe-tree.json');
  assert(tree.tierOrder.join(',') === 'N,R,SR,EP,L', 'fusion tierOrder 불일치');
  tree.jumps.forEach((j, i) => {
    assert(j.from === tree.tierOrder[i] && j.to === tree.tierOrder[i + 1], `fusion jump 체인 어긋남 ${j.from}->${j.to}`);
  });

  const stat = await loadJson('card-stat-schema.json');
  const statIds = new Set(stat.primaryStats.map((s) => s.statId));
  assert(stat.statBudget.byGrade.map((g) => g.grade).join(',') === 'N,R,SR,EP,L', 'stat budget 등급 불일치');

  const locs = await loadJson('placement-locations.json');
  const locIds = new Set(locs.locations.map((l) => l.locationId));
  for (const l of locs.locations) for (const s of (l.raise || [])) assert(statIds.has(s), `장소 raise 스탯 무효 ${l.locationId}:${s}`);

  const jobs = await loadJson('job-stat-profiles.json');
  const covered = new Set();
  for (const j of jobs.jobs) {
    for (const s of j.dominantStats) { assert(statIds.has(s), `직업 dominant 무효 ${j.jobId}:${s}`); covered.add(s); }
    for (const lid of (j.viaLocations || [])) assert(locIds.has(lid), `직업 viaLocation 무효 ${j.jobId}:${lid}`);
  }
  for (const s of statIds) assert(covered.has(s), `스탯 ${s}에 직업 경로 없음(막다른 빌드)`);

  const leg = await loadJson('legendary-anchor-set.json');
  const roster = await loadJson('hero-roster-by-race.json');
  const enemy = await loadJson('enemy-hero-roster.json');
  const rmap = new Map();
  for (const r of roster.races) for (const h of r.heroes) rmap.set(h.id, { race: r.raceName });
  for (const e of (enemy.enemyHeroes || [])) rmap.set(e.id, { race: e.race });
  for (const l of leg.legends) {
    assert(CARD_UID_RE.test(l.cardUid), `전설 cardUid 형식 ${l.cardUid}`);
    const h = rmap.get(l.characterId);
    assert(h, `전설 characterId 로스터 없음 ${l.characterId}`);
    assert(h.race === l.race, `전설 race 불일치 ${l.characterId}(${l.race}/${h.race})`);
  }

  const bp = await loadJson('battle-prototype.json');
  for (const m of ['negotiate', 'infiltrate', 'defend', 'transport']) {
    const c = bp.objectiveModes[m];
    assert(c && c.goalTarget && Array.isArray(c.actions) && c.actions.length, `objectiveMode 결손 ${m}`);
  }

  const w = await loadJson('world-map.json');
  for (const cont of w.continents) for (const isl of (cont.islands || [])) for (const sid of (isl.sites || [])) {
    assert(/^(HUB|STG|DUN|LOC)/.test(sid), `world-map site 형식 ${sid}`);
  }

  // 히든 합성 체인: cardUid 형식 + characterId 로스터 존재 + 전설 타깃 정합
  const hidden = await loadJson('hidden-fusion-recipes.json');
  const legendUids = new Set(leg.legends.map((l) => l.cardUid));
  for (const ch of hidden.chains) {
    const cardIds = new Set();
    for (const s of ch.steps) { s.inputs.forEach((i) => cardIds.add(i)); cardIds.add(s.result); }
    for (const cid of cardIds) {
      const m = CARD_UID_RE.exec(cid);
      assert(m, `히든 cardUid 형식 ${cid}`);
      assert(rmap.has(m[1]), `히든 카드 characterId 로스터 없음 ${cid}`);
    }
    if (ch.targetLegend) assert(legendUids.has(ch.targetLegend), `히든 체인 전설 타깃 불일치 ${ch.targetLegend}`);
    // 체인 연결성: 각 단계 결과가 다음 단계 입력에 포함
    for (let i = 0; i < ch.steps.length - 1; i++) {
      assert(ch.steps[i + 1].inputs.includes(ch.steps[i].result), `히든 체인 연결 끊김 step${i + 1}→${i + 2}`);
    }
  }
  console.log('카드게임 데이터 정합성 통과.');
}

// ---- 프로토타입 JS 구문 (회귀 방지) ----
async function checkPrototypeSyntax() {
  const protos = ['hub.js', 'world-map.js', 'fusion-lab.js', 'job-lab.js', 'battle-prototype.js', 'collection.js', 'hidden-lab.js', 'card-studio.js'];
  for (const f of protos) {
    const src = await readFile(path.join(WEB_DIR, f), 'utf8');
    try { new Function(src); } catch (e) { throw new Error(`${f} 구문 오류: ${e.message}`); }
  }
  console.log(`프로토타입 JS ${protos.length}개 구문 통과.`);
}

async function main() {
  const data = {
    resources: await loadJson('resources.json'),
    characters: await loadJson('characters.json'),
    events: await loadJson('events.json'),
    choices: await loadJson('choices.json'),
    combatBriefings: await loadJson('combat-briefings.json'),
    combatActions: await loadJson('combat-actions.json'),
    combatTypes: await loadJson('combat-scene-types.json'),
    combatResultRules: await loadJson('combat-result-rules.json')
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

  await checkAllJson();
  await checkCardGameData();
  await checkPrototypeSyntax();

  console.log('Web MVP smoke test passed.');
}

main().catch((error) => {
  console.error('Web MVP smoke test failed.');
  console.error(error);
  process.exit(1);
});
