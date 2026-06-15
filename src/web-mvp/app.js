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
  combatTypes: []
};

let gameState = null;
let lastResult = null;

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
    combatTypes
  ] = await Promise.all([
    loadJson('resources.json'),
    loadJson('characters.json'),
    loadJson('events.json'),
    loadJson('choices.json'),
    loadJson('combat-briefings.json'),
    loadJson('combat-actions.json'),
    loadJson('combat-scene-types.json')
  ]);

  database = { resources, characters, events, choices, combatBriefings, combatActions, combatTypes };
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

function startNewGame() {
  gameState = {
    currentDay: 1,
    currentStage: 1,
    stageName: '튜토리얼 운영 구간',
    resources: createInitialResources(),
    selectedChoices: [],
    progressionFlags: {},
    lastChoice: null,
    currentScreen: 'dayStart'
  };
  lastResult = null;
  renderDayStartScreen();
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
        <button class="secondary-button" data-action="event">현재 미션 보기</button>
        <button class="secondary-button" data-action="combat">전투 브리핑</button>
      </div>
    </section>
  `);
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
        <button class="primary-button" data-action="main">운영 본부로</button>
        <button class="secondary-button" data-action="event">현재 미션 보기</button>
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
    <button class="choice-button">
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
  const target = event.target.closest('[data-action], [data-choice-id]');
  if (!target || !app.contains(target)) return;

  const action = target.dataset.action;
  const choiceId = target.dataset.choiceId;

  if (choiceId) {
    applyChoice(choiceId);
    return;
  }

  if (!action) return;

  const actionMap = {
    'new-game': startNewGame,
    title: renderTitleScreen,
    about: renderAboutScreen,
    event: renderEventScreen,
    main: renderMainOperationScreen,
    combat: () => {
      if (!gameState) {
        gameState = {
          currentDay: 1,
          currentStage: 1,
          stageName: '튜토리얼 운영 구간',
          resources: createInitialResources(),
          selectedChoices: [],
          progressionFlags: {},
          lastChoice: null,
          currentScreen: 'combat'
        };
      }
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
