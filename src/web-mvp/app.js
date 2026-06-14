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
  bloodStock: '핵심 재고',
  bloodDemand: '이면 수요',
  familyFund: '자금',
  humanTrust: '신뢰',
  mediaExposure: '노출',
  securityLevel: '보안',
  familySatisfaction: '가문',
  organizationUnrest: '불안',
  blackMarketClue: '단서'
};

const app = document.querySelector('#app');

let database = {
  resources: [],
  characters: [],
  events: [],
  choices: []
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
  const [resources, characters, events, choices] = await Promise.all([
    loadJson('resources.json'),
    loadJson('characters.json'),
    loadJson('events.json'),
    loadJson('choices.json')
  ]);

  database = { resources, characters, events, choices };
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
    resources: createInitialResources(),
    selectedChoices: [],
    endingFlags: {},
    lastChoice: null,
    currentScreen: 'dayStart'
  };
  lastResult = null;
  renderDayStartScreen();
}

function addFlag(flag) {
  if (!flag) return;
  gameState.endingFlags[flag] = (gameState.endingFlags[flag] || 0) + 1;
}

function getDayEvent(day = gameState.currentDay) {
  return database.events.find((event) => Number(event.day) === Number(day));
}

function getChoicesForEvent(eventId) {
  return database.choices.filter((choice) => choice.eventId === eventId);
}

function getResourceStatus(resource) {
  if (!resource) return 'neutral';
  if (resource.value <= 10 || resource.value >= 90) return 'danger';
  if (resource.value < resource.safeMin || resource.value > resource.safeMax) return 'warn';
  return 'good';
}

function applyChoice(choiceId) {
  const choice = database.choices.find((item) => item.id === choiceId);
  if (!choice) return;

  const before = snapshotResources();
  const changes = choice.changes || {};

  Object.entries(changes).forEach(([key, delta]) => {
    if (!gameState.resources[key]) return;
    const resource = gameState.resources[key];
    resource.value = clamp(resource.value + Number(delta), resource.min, resource.max);
  });

  addFlag(choice.flag);

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
    renderFinalReport();
    return;
  }
  gameState.currentDay += 1;
  lastResult = null;
  renderDayStartScreen();
}

function getDominantEndingFlag() {
  const entries = Object.entries(gameState.endingFlags);
  if (entries.length === 0) return ['SUPPLY_STABLE', 0];
  return entries.sort((a, b) => b[1] - a[1])[0];
}

function getEndingTitle(flag) {
  const titles = {
    SUPPLY_STABLE: '안정 운영',
    SUPPLY_COLLAPSE: '공급 붕괴 위험',
    EXPOSED_MEDIA: '언론 노출 위험',
    FAMILY_DOMINANT: '가문 우선 운영',
    HUMAN_TRUST: '인간 사회 우선 운영',
    BLACK_MARKET_DOMINANT: '암거래 잠식 위험',
    INTERNAL_COLLAPSE: '내부 붕괴 위험'
  };
  return titles[flag] || '미분류 운영 결과';
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
      <p class="eyebrow">red-ledger-game</p>
      <h1>적혈의 장부</h1>
      <p class="subtle">The Red Ledger</p>
      <div class="card document warning">
        <div class="card-title">
          <h3>봉인된 운영 기록</h3>
          <span class="tag">MVP</span>
        </div>
        <p class="subtle">헌혈센터처럼 보이는 혈연센터. 그 이면의 수요와 장부를 관리하십시오.</p>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="new-game">새 게임</button>
        <button class="secondary-button" data-action="about">프로젝트 정보</button>
      </div>
    </section>
  `);
}

function renderAboutScreen() {
  setScreen(html`
    <section class="screen">
      <p class="eyebrow">project brief</p>
      <h2>다크 행정 누아르 운영 시뮬레이션</h2>
      <div class="card document">
        <div class="card-title">
          <h3>핵심 구조</h3>
          <span class="tag">기획 검증</span>
        </div>
        <p class="subtle">문서형 UI, 자원 관리, 선택지 처리, Day 진행, 캐릭터 반응, 최종 평가를 검증하는 웹 MVP입니다.</p>
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
      <div class="card document">
        <div class="card-title">
          <h3>${event.name}</h3>
          <span class="tag">${event.type}</span>
        </div>
        <p class="subtle">${event.summary}</p>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>관련 인물</h3>
          <span class="tag">${event.riskLevel}</span>
        </div>
        <p class="subtle">${event.relatedCharacters.join(' · ')}</p>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="event">보고서 확인</button>
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
      <div class="card document warning">
        <div class="card-title">
          <h3>${event.name}</h3>
          <span class="tag">${event.riskLevel}</span>
        </div>
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
        <p class="subtle">${lastResult.choice.resultSummary}</p>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>자원 변화</h3>
          <span class="tag">수급 ${lastResult.supplyCheck.label}</span>
        </div>
        <div class="result-list">
          ${resultItems.map((item) => `<div class="result-item">${item}</div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>인물 반응</h3>
          <span class="tag">관계</span>
        </div>
        <p class="subtle">${lastResult.choice.reaction}<br />${lastResult.choice.relationship}</p>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="next-day">${gameState.currentDay >= 7 ? '최종 평가로' : '다음 Day로'}</button>
        <button class="secondary-button" data-action="main">메인 운영 화면</button>
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
          <h3>오늘의 운영 상태</h3>
          <span class="tag">${supply.label}</span>
        </div>
        <p class="subtle">공급 차이: ${supply.diff}. 현재 상태는 ${supply.label}입니다.</p>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>기록</h3>
          <span class="tag">${gameState.selectedChoices.length}개 선택</span>
        </div>
        <p class="subtle">${gameState.selectedChoices.join(' · ') || '아직 기록된 선택지가 없습니다.'}</p>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="next-day">${gameState.currentDay >= 7 ? '최종 평가로' : '다음 Day로'}</button>
        <button class="secondary-button" data-action="event">현재 사건 보기</button>
      </div>
    </section>
  `);
}

function renderFinalReport() {
  const [flag, count] = getDominantEndingFlag();
  const title = getEndingTitle(flag);
  const supply = checkSupplyBalance();

  setScreen(html`
    <section class="screen">
      <p class="eyebrow">final report</p>
      <h2>${title}</h2>
      <p class="subtle">7일 운영 결과 보고</p>
      ${renderResourceGrid(['bloodStock', 'bloodDemand', 'humanTrust', 'mediaExposure', 'familySatisfaction', 'securityLevel', 'organizationUnrest', 'blackMarketClue'])}
      <div class="card document warning">
        <div class="card-title">
          <h3>최종 판정</h3>
          <span class="tag">${flag} · ${count}</span>
        </div>
        <p class="subtle">수급 판정은 ${supply.label}입니다. 선택 흐름은 다음 운영 기록에 남았습니다.</p>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>선택 이력</h3>
          <span class="tag">${gameState.selectedChoices.length}개</span>
        </div>
        <p class="subtle">${gameState.selectedChoices.join(' · ')}</p>
      </div>
      <div class="actions">
        <button class="primary-button" data-action="new-game">새 회차 시작</button>
        <button class="secondary-button" data-action="title">타이틀로</button>
      </div>
    </section>
  `);
}

function renderDayHeader() {
  return html`
    <header class="day-header">
      <div>
        <p class="eyebrow">Day ${gameState.currentDay}</p>
        <h2>${gameState.currentDay === 1 ? '부임 첫날' : `운영 ${gameState.currentDay}일차`}</h2>
        <div class="progress-dots">
          ${Array.from({ length: 7 }, (_, index) => `<span class="dot ${index + 1 <= gameState.currentDay ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>
      <span class="tag">관찰 단계</span>
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
      ${choice.text}
      <span class="choice-tone">${choice.tone}</span>
    </button>
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
    items.push(`${label} ${direction} (${delta > 0 ? '+' : ''}${delta})`);
  });
  return items.length ? items : ['눈에 띄는 자원 변화 없음'];
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
