const DATA_PATH = './data/';

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

const KEY_TO_UI_LABEL = {
  bloodStock: '헌혈 보유량',
  bloodDemand: '특수 수요',
  familyFund: '운영 자금',
  humanTrust: '시민 신뢰',
  mediaExposure: '노출 위험',
  securityLevel: '안전 관리',
  familySatisfaction: '후원 만족도',
  organizationUnrest: '직원 불안',
  blackMarketClue: '방해 단서'
};

const app = document.querySelector('#app');

let database = {
  resources: [],
  characters: [],
  events: [],
  choices: [],
  combatBriefings: [],
  combatActions: [],
  combatTypes: [],
  combatResultRules: null,
  nurses: [],
  shiftRules: null,
  mbtiSynergy: null,
  workplaceEvents: []
};

let gameState = null;
let lastResult = null;
let lastCombatResult = null;

async function loadJson(fileName) {
  const response = await fetch(`${DATA_PATH}${fileName}`);
  if (!response.ok) {
    throw new Error(`${fileName} 로딩 실패`);
  }
  return response.json();
}

async function loadData() {
  const [
    resources,
    characters,
    events,
    choices,
    combatBriefings,
    combatActions,
    combatTypes,
    combatResultRules,
    nurses,
    shiftRules,
    mbtiSynergy,
    workplaceEvents
  ] = await Promise.all([
    loadJson('resources.json'),
    loadJson('characters.json'),
    loadJson('events.json'),
    loadJson('choices.json'),
    loadJson('combat-briefings.json'),
    loadJson('combat-actions.json'),
    loadJson('combat-scene-types.json'),
    loadJson('combat-result-rules.json'),
    loadJson('nurse-npcs.json'),
    loadJson('shift-rotation-rules.json'),
    loadJson('mbti-synergy-rules.json'),
    loadJson('workplace-events.json')
  ]);

  database = {
    resources,
    characters,
    events,
    choices,
    combatBriefings,
    combatActions,
    combatTypes,
    combatResultRules,
    nurses,
    shiftRules,
    mbtiSynergy,
    workplaceEvents
  };
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function createInitialResources() {
  const resources = {};
  database.resources.forEach((resource) => {
    const key = RESOURCE_KEYS[resource.name];
    if (!key) return;
    resources[key] = {
      id: resource.id,
      name: resource.name,
      uiName: resource.uiName,
      value: resource.initialValue,
      min: resource.min,
      max: resource.max,
      safeMin: resource.safeMin,
      safeMax: resource.safeMax
    };
  });
  return resources;
}

function createRuntimeGameState(screen = 'dayStart') {
  return {
    currentDay: 1,
    currentStage: 1,
    stageName: '튜토리얼 운영 구간',
    resources: createInitialResources(),
    selectedChoices: [],
    progressionFlags: {},
    lastChoice: null,
    currentScreen: screen
  };
}

function startNewGame() {
  gameState = createRuntimeGameState('dayStart');
  lastResult = null;
  lastCombatResult = null;
  renderDayStartScreen();
}

function ensureGameState(screen = 'combat') {
  if (!gameState) {
    gameState = createRuntimeGameState(screen);
  }
}

function addProgressionFlag(flag) {
  if (!flag) return;
  gameState.progressionFlags[flag] = (gameState.progressionFlags[flag] || 0) + 1;
}

function getDayEvent(day = gameState.currentDay) {
  return database.events.find((event) => Number(event.day) === Number(day));
}

function getChoicesForEvent(eventId) {
  return database.choices.filter((choice) => choice.eventId === eventId);
}

function getChoiceById(choiceId) {
  return database.choices.find((choice) => choice.id === choiceId);
}

function getCombatBriefing(index = 0) {
  return database.combatBriefings[index] || database.combatBriefings[0];
}

function getCombatType(combatTypeId) {
  return database.combatTypes.find((item) => item.combatTypeId === combatTypeId);
}

function getActionByName(name) {
  return database.combatActions.find((action) => action.name === name);
}

function getCombatAction(actionId) {
  return database.combatActions.find((action) => action.actionId === actionId);
}

function getNursesByShift(shiftTeam) {
  return database.nurses.filter((nurse) => nurse.shiftTeam === shiftTeam);
}

function getResourceStatus(resource) {
  if (!resource) return 'neutral';
  if (resource.value <= 10 || resource.value >= 90) return 'danger';
  if (resource.value < resource.safeMin || resource.value > resource.safeMax) return 'warn';
  return 'good';
}

function applyChoice(choiceId) {
  const choice = getChoiceById(choiceId);
  if (!choice) return;

  const before = snapshotResources();
  const changes = choice.changes || {};

  Object.entries(changes).forEach(([key, delta]) => {
    if (!gameState.resources[key]) return;
    const resource = gameState.resources[key];
    resource.value = clamp(resource.value + Number(delta), resource.min, resource.max);
  });

  addProgressionFlag(choice.flag);

  gameState.selectedChoices.push(choice.id);
  gameState.lastChoice = choice.id;

  lastResult = {
    choice,
    before,
    after: snapshotResources(),
    supplyCheck: checkSupplyBalance()
  };

  renderResultScreen();
}

function applyCombatAction(actionId) {
  ensureGameState('combatResult');
  const action = getCombatAction(actionId);
  if (!action) return;

  const briefing = getCombatBriefing();
  lastCombatResult = buildCombatResult(action, briefing);
  applyCombatResultToResources(lastCombatResult);
  renderCombatResultScreen();
}

function applyCombatResultToResources(result) {
  if (!gameState || !result) return;
  const resourceEffects = {
    humanTrust: Math.round((result.meters.humanTrust - 60) / 5),
    mediaExposure: Math.round((result.meters.secretExposure - 25) / 6),
    securityLevel: Math.round((result.meters.facilityStability - 70) / 6),
    blackMarketClue: result.action.name === '증거 회수' ? 6 : 0,
    organizationUnrest: result.rank === 'D' ? 5 : result.rank === 'S' ? -3 : 0
  };

  Object.entries(resourceEffects).forEach(([key, delta]) => {
    const resource = gameState.resources[key];
    if (!resource || !delta) return;
    resource.value = clamp(resource.value + delta, resource.min, resource.max);
  });
}

function snapshotResources() {
  const snapshot = {};
  Object.entries(gameState.resources).forEach(([key, resource]) => {
    snapshot[key] = resource.value;
  });
  return snapshot;
}

function checkSupplyBalance() {
  const stock = gameState.resources.bloodStock?.value ?? 0;
  const demand = gameState.resources.bloodDemand?.value ?? 0;
  const diff = stock - demand;

  if (diff <= -30) return { diff, label: '심각한 부족', tone: 'danger' };
  if (diff <= -10) return { diff, label: '부족', tone: 'warn' };
  if (diff <= 20) return { diff, label: '적정', tone: 'good' };
  if (diff <= 40) return { diff, label: '과잉', tone: 'warn' };
  return { diff, label: '위험한 과잉', tone: 'danger' };
}

function advanceDay() {
  if (gameState.currentDay >= 7) {
    renderStageResult();
    return;
  }
  gameState.currentDay += 1;
  lastResult = null;
  renderDayStartScreen();
}

function getDominantProgressionFlag() {
  const entries = Object.entries(gameState.progressionFlags);
  if (entries.length === 0) return ['SUPPLY_STABLE', 0];
  return entries.sort((a, b) => b[1] - a[1])[0];
}

function getStageResultTitle(flag) {
  const titles = {
    SUPPLY_STABLE: '안정 운영 클리어',
    SUPPLY_COLLAPSE: '공급 붕괴 위험 클리어',
    EXPOSED_MEDIA: '언론 노출 위험 클리어',
    FAMILY_DOMINANT: '후원 우선 루트 클리어',
    HUMAN_TRUST: '시민 신뢰 루트 클리어',
    BLACK_MARKET_DOMINANT: '방해 세력 잠식 위험 클리어',
    INTERNAL_COLLAPSE: '내부 붕괴 위험 클리어'
  };
  return titles[flag] || '미분류 루트 클리어';
}

function getClearRank() {
  const trust = gameState.resources.humanTrust?.value ?? 0;
  const exposure = gameState.resources.mediaExposure?.value ?? 0;
  const unrest = gameState.resources.organizationUnrest?.value ?? 0;
  const clue = gameState.resources.blackMarketClue?.value ?? 0;
  const stabilityScore = trust + (100 - exposure) + (100 - unrest) + clue;

  if (stabilityScore >= 270) return 'S';
  if (stabilityScore >= 230) return 'A';
  if (stabilityScore >= 190) return 'B';
  if (stabilityScore >= 150) return 'C';
  return 'D';
}

function buildCombatResult(action, briefing) {
  const effects = action.effects || {};
  const isSupportive = ['보호', '협상', '응급 처치', '진정 안내'].includes(action.name);
  const isConcealment = ['은폐', '증거 회수', '보안 봉쇄'].includes(action.name);
  const isRetreat = action.name === '후퇴';

  const visitorSafety = clamp(74 + (effects.visitorSafety || 0) + Math.round((effects.teamSurvival || 0) / 2) + (isSupportive ? 8 : 0) + (isRetreat ? 5 : 0));
  const secretExposure = clamp(28 + (effects.secretExposure || 0) + (isConcealment ? -8 : 0) + (isRetreat ? 6 : 0));
  const facilityStability = clamp(70 + (effects.facilityStability || 0) + Math.round((effects.securityLevel || 0) / 2) + (action.name === '보안 봉쇄' ? 6 : 0));
  const humanTrust = clamp(62 + (effects.humanTrust || 0) + (isSupportive ? 5 : 0) - (action.name === '은폐' ? 2 : 0));
  const coexistenceScore = clamp(62 + (effects.coexistenceScore || 0) + (isSupportive ? 14 : 0) + (action.category.includes('비살상') ? 12 : 0) + (isRetreat ? 4 : 0) - (secretExposure > 45 ? 8 : 0));

  const rank = getCombatRank({ visitorSafety, secretExposure, coexistenceScore });
  const rankLabel = getCombatRankLabel(rank);

  return {
    action,
    briefing,
    rank,
    rankLabel,
    meters: {
      visitorSafety,
      secretExposure,
      facilityStability,
      humanTrust,
      coexistenceScore
    },
    goals: buildCombatGoalResults(briefing, rank),
    rewards: buildCombatRewards(action, rank),
    nextImpact: buildCombatNextImpact(action, rank)
  };
}

function getCombatRank({ visitorSafety, secretExposure, coexistenceScore }) {
  if (visitorSafety >= 90 && secretExposure <= 15 && coexistenceScore >= 85) return 'S';
  if (visitorSafety >= 80 && secretExposure <= 25 && coexistenceScore >= 70) return 'A';
  if (visitorSafety >= 65 && secretExposure <= 40) return 'B';
  if (visitorSafety >= 50 && secretExposure <= 60) return 'C';
  return 'D';
}

function getCombatRankLabel(rank) {
  const labels = {
    S: '완벽한 공생 방어',
    A: '안정적 해결',
    B: '부분 해결',
    C: '위험한 해결',
    D: '운영 리스크 발생'
  };
  return labels[rank] || '미분류 결과';
}

function buildCombatGoalResults(briefing, rank) {
  const successCount = rank === 'S' ? 3 : rank === 'A' ? 3 : rank === 'B' ? 2 : rank === 'C' ? 1 : 0;
  return briefing.winConditions.map((condition, index) => ({
    condition,
    achieved: index < successCount
  }));
}

function buildCombatRewards(action, rank) {
  const rankBonus = { S: 1.5, A: 1.25, B: 1, C: 0.75, D: 0.5 }[rank] || 1;
  const baseExp = Math.round(100 * rankBonus);
  const baseCoin = Math.round(120 * rankBonus);
  const rewards = [`캐릭터 경험치 +${baseExp}`, `운영 자금 +${baseCoin}`];

  if (['증거 회수', '은폐'].includes(action.name)) rewards.push('방해 단서 +6');
  if (['보호', '응급 처치', '진정 안내', '협상'].includes(action.name)) rewards.push('시민 신뢰 상승');
  if (rank === 'S' || rank === 'A') rewards.push('직원 사기 상승');
  if (rank === 'D') rewards.push('위험도 관리 필요');

  return rewards;
}

function buildCombatNextImpact(action, rank) {
  const impacts = [];
  if (rank === 'S' || rank === 'A') impacts.push('다음 이벤트에서 협상/보호 선택지 강화');
  if (rank === 'B') impacts.push('다음 구간에서 추가 점검 이벤트 발생 가능');
  if (rank === 'C' || rank === 'D') impacts.push('방해 세력 활동도 상승 가능');
  if (action.name === '증거 회수') impacts.push('암거래 관련 스테이지 해금 조건 진전');
  if (action.name === '후퇴') impacts.push('보상 감소, 인명 피해 최소화');
  return impacts.length ? impacts : ['센터 운영 안정 유지'];
}

function html(strings, ...values) {
  return strings.map((string, index) => `${string}${values[index] ?? ''}`).join('');
}

function setScreen(content) {
  app.innerHTML = content;
}

function renderTitleScreen() {
  setScreen(html`
    <section class="title-screen">
      <p class="eyebrow">donation center management rpg</p>
      <h1>헌혈의 집</h1>
      <p class="subtle">사람과 생명이 있는 따뜻한 공간</p>
      <div class="card document warning seal-card">
        <div class="card-title">
          <h3>센터 운영 기록</h3>
          <span class="tag">Stage MVP</span>
        </div>
        <p class="subtle">밝고 친절한 헌혈센터를 운영하며 직원, 방문자, 센터 신뢰, 비밀 유지, 방해 세력 대응을 함께 관리하십시오.</p>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="new-game">센터 운영 시작</button>
        <button class="secondary-button" data-action="staff">직원/근무표 보기</button>
        <button class="secondary-button" data-action="combat">전투 브리핑 보기</button>
        <button class="secondary-button" data-action="about">프로젝트 정보</button>
      </div>
    </section>
  `);
}

function renderAboutScreen() {
  setScreen(html`
    <section class="screen">
      <p class="eyebrow">project brief</p>
      <h2>밝은 센터 운영 + 성장형 전략 게임</h2>
      <div class="card document">
        <div class="card-title">
          <h3>핵심 구조</h3>
          <span class="tag">기획 검증</span>
        </div>
        <p class="subtle">직원 근무표, 방문자 응대, 센터 신뢰, 이벤트 처리, 캐릭터 성장, 전투 브리핑, 스테이지 정산을 검증하는 웹 MVP입니다.</p>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="title">돌아가기</button>
      </div>
    </section>
  `);
}

function renderDayStartScreen() {
  const event = getDayEvent();
  setScreen(html`
    <section class="screen">
      ${renderDayHeader()}
      ${renderResourceGrid(['bloodStock', 'bloodDemand', 'humanTrust', 'mediaExposure', 'familySatisfaction'])}
      <div class="card document case-file">
        <div class="card-title">
          <h3>${event.name}</h3>
          <span class="tag">${event.type}</span>
        </div>
        ${renderEventMeta(event)}
        <p class="subtle">${event.summary}</p>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>관련 인물</h3>
          <span class="tag">${event.riskLevel}</span>
        </div>
        <div class="person-list">
          ${event.relatedCharacters.map((name) => `<span class="person-chip">${name}</span>`).join('')}
        </div>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="event">미션 보고서 확인</button>
        <button class="secondary-button" data-action="staff">직원/근무표</button>
        <button class="secondary-button" data-action="combat">전투 브리핑</button>
      </div>
    </section>
  `);
}

function renderEventScreen() {
  const event = getDayEvent();
  const choices = getChoicesForEvent(event.id);

  setScreen(html`
    <section class="screen">
      ${renderDayHeader()}
      ${renderResourceGrid(['bloodStock', 'bloodDemand', 'humanTrust', 'mediaExposure', 'familySatisfaction'])}
      <div class="card document warning case-file">
        <div class="card-title">
          <h3>${event.name}</h3>
          <span class="tag risk-${getRiskClass(event.riskLevel)}">${event.riskLevel}</span>
        </div>
        ${renderEventMeta(event)}
        <p class="subtle">${event.sceneText}</p>
      </div>
      <div class="choice-list">
        ${choices.map((choice, index) => renderChoiceButton(choice, index === 1)).join('')}
      </div>
    </section>
  `);
}

function renderResultScreen() {
  const resultItems = buildResultItems(lastResult);
  setScreen(html`
    <section class="screen">
      ${renderDayHeader()}
      <div class="card document">
        <div class="card-title">
          <h3>선택 결과</h3>
          <span class="tag">${lastResult.choice.tone}</span>
        </div>
        <div class="choice-summary">
          <span class="choice-code">${lastResult.choice.id}</span>
          <strong>${lastResult.choice.text}</strong>
        </div>
        <p class="subtle">${lastResult.choice.resultSummary}</p>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>자원 변화</h3>
          <span class="tag status-${lastResult.supplyCheck.tone}">수급 ${lastResult.supplyCheck.label}</span>
        </div>
        <div class="result-list">
          ${resultItems.map((item) => renderResultItem(item)).join('')}
        </div>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>인물 반응</h3>
          <span class="tag">관계</span>
        </div>
        <p class="subtle">${lastResult.choice.reaction}</p>
        ${renderRelationshipTags(lastResult.choice.relationship)}
      </div>
      <div class="actions">
        <button class="primary-button" data-action="next-day">${gameState.currentDay >= 7 ? '스테이지 정산으로' : '다음 구간으로'}</button>
        <button class="secondary-button" data-action="main">운영 본부 화면</button>
      </div>
    </section>
  `);
}

function renderMainOperationScreen() {
  const supply = checkSupplyBalance();
  setScreen(html`
    <section class="screen">
      ${renderDayHeader()}
      ${renderResourceGrid(['bloodStock', 'bloodDemand', 'humanTrust', 'mediaExposure', 'familySatisfaction', 'securityLevel', 'organizationUnrest', 'blackMarketClue'])}
      <div class="card document">
        <div class="card-title">
          <h3>현재 운영 상태</h3>
          <span class="tag status-${supply.tone}">${supply.label}</span>
        </div>
        <p class="subtle">공급 차이: ${supply.diff}. 이 상태는 Stage ${gameState.currentStage} 클리어 랭크와 다음 스테이지 개방 조건에 반영됩니다.</p>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>운영 기록</h3>
          <span class="tag">${gameState.selectedChoices.length}개 선택</span>
        </div>
        ${renderChoiceHistory()}
      </div>
      <div class="actions">
        <button class="primary-button" data-action="next-day">${gameState.currentDay >= 7 ? '스테이지 정산으로' : '다음 구간으로'}</button>
        <button class="secondary-button" data-action="staff">직원/근무표</button>
        <button class="secondary-button" data-action="event">현재 미션 보기</button>
        <button class="secondary-button" data-action="combat">전투 브리핑</button>
      </div>
    </section>
  `);
}

function renderStaffScreen() {
  ensureGameState('staff');
  const shiftRules = database.shiftRules;
  const teamBonus = database.mbtiSynergy?.teamBonusRules?.[0];
  const sampleEvents = database.workplaceEvents.slice(0, 3);

  setScreen(html`
    <section class="screen">
      ${renderDayHeader()}
      <p class="eyebrow">staff roster</p>
      <h2>직원/근무표</h2>
      <div class="card document">
        <div class="card-title">
          <h3>3조 3교대 운영</h3>
          <span class="tag">${shiftRules?.shiftSystem || '3조 3교대'}</span>
        </div>
        <p class="subtle">간호사 NPC는 밝고 상냥한 서비스직 마인드를 기본으로 하며, A/B/C조 로테이션과 피로도, 사기, 팀 신뢰, MBTI 시너지 영향을 받습니다.</p>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>근무 시간표</h3>
          <span class="tag">오늘 기준</span>
        </div>
        <div class="history-list full">
          ${shiftRules.shifts.map((shift, index) => renderSimpleHistoryItem(index + 1, `${shift.name} · ${shift.time}`, shift.mainTasks.join(' / '))).join('')}
        </div>
      </div>
      ${renderShiftTeamSection('A조', '오전조')}
      ${renderShiftTeamSection('B조', '오후조')}
      ${renderShiftTeamSection('C조', '야간/마감조')}
      <div class="card compact-card">
        <div class="card-title">
          <h3>MBTI 시너지</h3>
          <span class="tag">${teamBonus?.name || '균형 조합'}</span>
        </div>
        <p class="subtle">${teamBonus?.condition || '성향이 고르게 섞이면 응대, 문서, 위기 대응에서 균형 보너스가 발생합니다.'}</p>
        <div class="person-list">
          ${Object.entries(teamBonus?.effect || { serviceQuality: 10, conflictRisk: -5, humanTrust: 4 }).map(([key, value]) => `<span class="relationship-chip">${key} ${value > 0 ? '+' : ''}${value}</span>`).join('')}
        </div>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>직장 내 이벤트 후보</h3>
          <span class="tag risk-high">랜덤 발생</span>
        </div>
        <div class="history-list full">
          ${sampleEvents.map((item, index) => renderSimpleHistoryItem(index + 1, `${item.name} · ${item.eventType}`, item.description)).join('')}
        </div>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="main">운영 본부로</button>
        <button class="secondary-button" data-action="combat">전투 브리핑</button>
      </div>
    </section>
  `);
}

function renderShiftTeamSection(teamName, label) {
  const members = getNursesByShift(teamName);
  return html`
    <div class="card compact-card">
      <div class="card-title">
        <h3>${teamName} · ${label}</h3>
        <span class="tag">${members.length}명</span>
      </div>
      <div class="history-list full">
        ${members.map((nurse, index) => renderNurseItem(nurse, index + 1)).join('')}
      </div>
    </div>
  `;
}

function renderNurseItem(nurse, index) {
  return html`
    <div class="history-item">
      <span class="history-index">${index}</span>
      <div>
        <span class="choice-code">${nurse.mbti}</span>
        <strong>${nurse.name} · ${nurse.personality}</strong>
        <small>${nurse.workStrengths.join(' / ')} · 피로 ${nurse.fatigue} · 사기 ${nurse.morale}</small>
      </div>
    </div>
  `;
}

function renderCombatBriefingScreen() {
  const briefing = getCombatBriefing();
  const combatType = getCombatType(briefing.combatTypeId);
  const preferredActions = briefing.preferredActions
    .map((name) => getActionByName(name))
    .filter(Boolean);

  setScreen(html`
    <section class="screen">
      ${gameState ? renderDayHeader() : ''}
      <p class="eyebrow">combat briefing</p>
      <h2>${briefing.title}</h2>
      <div class="card document warning">
        <div class="card-title">
          <h3>${combatType?.name || '전투 브리핑'}</h3>
          <span class="tag">${briefing.location}</span>
        </div>
        <p class="subtle">${briefing.summary}</p>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>추천 편성</h3>
          <span class="tag">${briefing.threatFaction}</span>
        </div>
        <div class="person-list">
          ${briefing.recommendedTeam.map((name) => `<span class="person-chip">${name}</span>`).join('')}
        </div>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>클리어 조건</h3>
          <span class="tag">공생 방어</span>
        </div>
        <div class="history-list full">
          ${briefing.winConditions.map((item, index) => renderSimpleHistoryItem(index + 1, item, '승리 조건')).join('')}
        </div>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>실패 조건</h3>
          <span class="tag risk-high">주의</span>
        </div>
        <div class="history-list full">
          ${briefing.loseConditions.map((item, index) => renderSimpleHistoryItem(index + 1, item, '실패 조건')).join('')}
        </div>
      </div>
      <div class="choice-list">
        ${preferredActions.map((action) => renderCombatActionButton(action)).join('')}
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>예상 보상</h3>
          <span class="tag">정산 미리보기</span>
        </div>
        <div class="person-list">
          ${briefing.rewardPreview.map((item) => `<span class="relationship-chip">${item}</span>`).join('')}
        </div>
      </div>
      <div class="actions">
        <button class="secondary-button" data-action="main">운영 본부로</button>
        <button class="secondary-button" data-action="staff">직원/근무표</button>
        <button class="secondary-button" data-action="event">현재 미션 보기</button>
      </div>
    </section>
  `);
}

function renderCombatResultScreen() {
  const result = lastCombatResult;
  if (!result) {
    renderCombatBriefingScreen();
    return;
  }

  setScreen(html`
    <section class="screen final-screen">
      ${gameState ? renderDayHeader() : ''}
      <p class="eyebrow">combat result</p>
      <h2>작전 정산</h2>
      <div class="card document warning">
        <div class="card-title">
          <h3>${result.rankLabel}</h3>
          <span class="tag">RANK ${result.rank}</span>
        </div>
        <p class="subtle">${result.briefing.title}에서 <strong>${result.action.name}</strong> 행동을 선택했습니다. 전투는 처치가 아니라 센터 운영 보호와 공생 질서 유지를 기준으로 평가됩니다.</p>
      </div>
      <div class="resource-grid">
        ${renderCombatMeterCard('방문자 안전도', result.meters.visitorSafety, 'good')}
        ${renderCombatMeterCard('비밀 노출도', result.meters.secretExposure, result.meters.secretExposure > 45 ? 'danger' : 'warn')}
        ${renderCombatMeterCard('시설 안정도', result.meters.facilityStability, 'good')}
        ${renderCombatMeterCard('시민 신뢰', result.meters.humanTrust, 'good')}
        ${renderCombatMeterCard('공생 점수', result.meters.coexistenceScore, 'good')}
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>목표 달성</h3>
          <span class="tag">${result.goals.filter((goal) => goal.achieved).length}/${result.goals.length}</span>
        </div>
        <div class="history-list full">
          ${result.goals.map((goal, index) => renderSimpleHistoryItem(index + 1, `${goal.achieved ? '완료' : '미달'} · ${goal.condition}`, '작전 목표')).join('')}
        </div>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>획득 보상</h3>
          <span class="tag">보상</span>
        </div>
        <div class="person-list">
          ${result.rewards.map((item) => `<span class="relationship-chip">${item}</span>`).join('')}
        </div>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>다음 영향</h3>
          <span class="tag">연결 이벤트</span>
        </div>
        <div class="history-list full">
          ${result.nextImpact.map((item, index) => renderSimpleHistoryItem(index + 1, item, '다음 구간 영향')).join('')}
        </div>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="main">운영 본부로 반영</button>
        <button class="secondary-button" data-action="combat">다른 전투 브리핑 보기</button>
      </div>
    </section>
  `);
}

function renderStageResult() {
  const [flag, count] = getDominantProgressionFlag();
  const title = getStageResultTitle(flag);
  const supply = checkSupplyBalance();
  const rank = getClearRank();

  setScreen(html`
    <section class="screen final-screen">
      <p class="eyebrow">stage result</p>
      <h2>${title}</h2>
      <p class="subtle">Stage ${gameState.currentStage} · 튜토리얼 운영 구간 정산</p>
      ${renderResourceGrid(['bloodStock', 'bloodDemand', 'humanTrust', 'mediaExposure', 'familySatisfaction', 'securityLevel', 'organizationUnrest', 'blackMarketClue'])}
      <div class="card document warning">
        <div class="card-title">
          <h3>클리어 판정</h3>
          <span class="tag">RANK ${rank}</span>
        </div>
        <div class="final-verdict">
          <span class="verdict-label status-${supply.tone}">수급 ${supply.label}</span>
          <p class="subtle">이번 스테이지의 운영 성향은 다음 구간의 명성, 해금 조건, 스테이지 난이도에 반영됩니다.</p>
          <p class="subtle">주요 경향: ${flag} · ${count}</p>
        </div>
      </div>
      <div class="card compact-card">
        <div class="card-title">
          <h3>선택 이력</h3>
          <span class="tag">${gameState.selectedChoices.length}개</span>
        </div>
        ${renderChoiceHistory('full')}
      </div>
      <div class="actions">
        <button class="primary-button" data-action="new-game">다음 스테이지 준비</button>
        <button class="secondary-button" data-action="title">운영 본부로</button>
      </div>
    </section>
  `);
}

function renderDayHeader() {
  return html`
    <header class="day-header">
      <div>
        <p class="eyebrow">Stage ${gameState.currentStage} · Day ${gameState.currentDay}</p>
        <h2>${gameState.currentDay === 1 ? '튜토리얼 부임' : `운영 ${gameState.currentDay}구간`}</h2>
        <div class="progress-dots">
          ${Array.from({ length: 7 }, (_, index) => `<span class="dot ${index + 1 <= gameState.currentDay ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>
      <span class="tag">튜토리얼 스테이지</span>
    </header>
  `;
}

function renderResourceGrid(keys) {
  return html`
    <div class="resource-grid">
      ${keys.map((key) => {
        const resource = gameState.resources[key];
        if (!resource) return '';
        const status = getResourceStatus(resource);
        return html`
          <div class="resource-card ${status}">
            <span class="resource-label">${resource.uiName || KEY_TO_UI_LABEL[key] || resource.name}</span>
            <strong class="resource-value">${resource.value}</strong>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderCombatMeterCard(label, value, status = 'good') {
  return html`
    <div class="resource-card ${status}">
      <span class="resource-label">${label}</span>
      <strong class="resource-value">${value}</strong>
    </div>
  `;
}

function renderChoiceButton(choice, primary = false) {
  return html`
    <button class="choice-button ${primary ? 'primary' : ''}" data-choice-id="${choice.id}">
      <span class="choice-code">${choice.id}</span>
      ${choice.text}
      <span class="choice-tone">${choice.tone}</span>
    </button>
  `;
}

function renderCombatActionButton(action) {
  return html`
    <button class="choice-button" data-combat-action-id="${action.actionId}">
      <span class="choice-code">${action.category}</span>
      ${action.name}
      <span class="choice-tone">${action.description}</span>
    </button>
  `;
}

function renderSimpleHistoryItem(index, title, subtitle = '') {
  return html`
    <div class="history-item">
      <span class="history-index">${index}</span>
      <div>
        <strong>${title}</strong>
        <small>${subtitle}</small>
      </div>
    </div>
  `;
}

function renderEventMeta(event) {
  return html`
    <div class="case-meta">
      <span>${event.id}</span>
      <span>${event.type}</span>
      <span>위험도 ${event.riskLevel}</span>
    </div>
  `;
}

function getRiskClass(riskLevel = '') {
  if (riskLevel.includes('매우')) return 'critical';
  if (riskLevel.includes('높음')) return 'high';
  return 'medium';
}

function renderChoiceHistory(mode = 'compact') {
  if (!gameState.selectedChoices.length) {
    return '<p class="subtle">아직 기록된 선택지가 없습니다.</p>';
  }

  return html`
    <div class="history-list ${mode}">
      ${gameState.selectedChoices.map((choiceId, index) => {
        const choice = getChoiceById(choiceId);
        if (!choice) return '';
        return html`
          <div class="history-item">
            <span class="history-index">${index + 1}</span>
            <div>
              <span class="choice-code">${choice.id}</span>
              <strong>${choice.text}</strong>
              <small>${choice.tone}</small>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRelationshipTags(relationship = '') {
  const items = relationship.split(';').map((item) => item.trim()).filter(Boolean);
  if (!items.length) return '';
  return html`
    <div class="relationship-list">
      ${items.map((item) => `<span class="relationship-chip">${item}</span>`).join('')}
    </div>
  `;
}

function buildResultItems(result) {
  if (!result) return [];
  const items = [];
  Object.keys(result.after).forEach((key) => {
    const before = result.before[key];
    const after = result.after[key];
    const delta = after - before;
    if (delta === 0) return;
    const label = KEY_TO_UI_LABEL[key] || key;
    const direction = delta > 0 ? '증가' : '감소';
    const tone = delta > 0 ? 'up' : 'down';
    items.push({ label, direction, delta, tone });
  });
  return items.length ? items : [{ label: '자원', direction: '변화 없음', delta: 0, tone: 'flat' }];
}

function renderResultItem(item) {
  const sign = item.delta > 0 ? '+' : '';
  const value = item.delta === 0 ? '0' : `${sign}${item.delta}`;
  return html`
    <div class="result-item ${item.tone}">
      <span>${item.label}</span>
      <strong>${item.direction}</strong>
      <em>${value}</em>
    </div>
  `;
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-choice-id], [data-combat-action-id]');
  if (!target || !app.contains(target)) return;

  const action = target.dataset.action;
  const choiceId = target.dataset.choiceId;
  const combatActionId = target.dataset.combatActionId;

  if (choiceId) {
    applyChoice(choiceId);
    return;
  }

  if (combatActionId) {
    applyCombatAction(combatActionId);
    return;
  }

  if (!action) return;

  const actionMap = {
    'new-game': startNewGame,
    title: renderTitleScreen,
    about: renderAboutScreen,
    event: renderEventScreen,
    main: renderMainOperationScreen,
    staff: () => {
      ensureGameState('staff');
      renderStaffScreen();
    },
    combat: () => {
      ensureGameState('combat');
      renderCombatBriefingScreen();
    },
    'next-day': advanceDay
  };

  actionMap[action]?.();
});

async function boot() {
  try {
    await loadData();
    renderTitleScreen();
  } catch (error) {
    setScreen(`
      <section class="screen">
        <p class="eyebrow">error</p>
        <h2>데이터 로딩 실패</h2>
        <div class="card warning">
          <p class="subtle">${error.message}</p>
        </div>
        <p class="footer-note">로컬 파일로 직접 열면 브라우저 정책 때문에 JSON 로딩이 막힐 수 있습니다. 간단한 로컬 서버로 실행하세요.</p>
      </section>
    `);
  }
}

boot();
