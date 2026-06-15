const DATA_PATH = './data/';

const state = {
  view: 'hero',
  race: 'all',
  aura: 'all',
  heroes: [],
  enemies: [],
  arcs: []
};

const auraMeta = {
  'AURA-GOOD-BLUE': { label: '선', color: '#1976d2' },
  'AURA-EVIL-DARKRED': { label: '악', color: '#8b1e24' },
  'AURA-AMBIGUOUS-PURPLE': { label: '중립', color: '#7b3dbb' },
  'AURA-LEGEND-GOLD': { label: '전설', color: '#c79524' }
};

const listEl = document.querySelector('#codex-list');
const countEl = document.querySelector('#result-count');
const raceFilter = document.querySelector('#race-filter');
const auraFilter = document.querySelector('#aura-filter');
const tabButtons = [...document.querySelectorAll('[data-view]')];

async function loadJson(fileName) {
  const response = await fetch(`${DATA_PATH}${fileName}`);
  if (!response.ok) throw new Error(`${fileName} 로딩 실패`);
  return response.json();
}

async function boot() {
  const [heroData, enemyData, arcData] = await Promise.all([
    loadJson('hero-roster-by-race.json'),
    loadJson('enemy-hero-roster.json'),
    loadJson('character-story-arcs.json')
  ]);

  state.heroes = flattenHeroes(heroData);
  state.enemies = enemyData.enemyHeroes || [];
  state.arcs = arcData.characterArcs || [];

  bindEvents();
  fillFilters();
  render();
}

function flattenHeroes(heroData) {
  return (heroData.races || []).flatMap((race) => {
    return (race.heroes || []).map((hero) => ({
      ...hero,
      race: race.raceName,
      raceId: race.raceId,
      specialization: race.specialization || []
    }));
  });
}

function bindEvents() {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      tabButtons.forEach((item) => item.classList.toggle('active', item === button));
      fillFilters();
      render();
    });
  });

  raceFilter.addEventListener('change', () => {
    state.race = raceFilter.value;
    render();
  });

  auraFilter.addEventListener('change', () => {
    state.aura = auraFilter.value;
    render();
  });
}

function fillFilters() {
  const items = getCurrentRawItems();
  const raceValues = [...new Set(items.map((item) => item.race).filter(Boolean))].sort();
  const auraValues = [...new Set(items.map((item) => item.aura).filter(Boolean))];

  state.race = 'all';
  state.aura = 'all';

  raceFilter.innerHTML = '<option value="all">전체 종족</option>' + raceValues.map((race) => `<option value="${escapeHtml(race)}">${escapeHtml(race)}</option>`).join('');
  auraFilter.innerHTML = '<option value="all">전체 아우라</option>' + auraValues.map((aura) => `<option value="${escapeHtml(aura)}">${escapeHtml(getAuraLabel(aura))}</option>`).join('');

  raceFilter.disabled = state.view === 'arc';
  auraFilter.disabled = false;
}

function getCurrentRawItems() {
  if (state.view === 'enemy') return state.enemies;
  if (state.view === 'arc') return state.arcs;
  return state.heroes;
}

function getFilteredItems() {
  return getCurrentRawItems().filter((item) => {
    const raceOk = state.race === 'all' || item.race === state.race;
    const auraOk = state.aura === 'all' || item.aura === state.aura;
    return raceOk && auraOk;
  });
}

function render() {
  const items = getFilteredItems();
  countEl.textContent = `${items.length}명`;

  if (!items.length) {
    listEl.innerHTML = '<div class="card"><p class="subtle">조건에 맞는 캐릭터가 없습니다.</p></div>';
    return;
  }

  if (state.view === 'enemy') {
    listEl.innerHTML = items.map(renderEnemyCard).join('');
    return;
  }

  if (state.view === 'arc') {
    listEl.innerHTML = items.map(renderArcCard).join('');
    return;
  }

  listEl.innerHTML = items.map(renderHeroCard).join('');
}

function renderHeroCard(hero) {
  const aura = auraMeta[hero.aura] || auraMeta['AURA-GOOD-BLUE'];
  return `
    <article class="character-card" style="--aura-color:${aura.color}">
      <div class="character-head">
        <div class="character-name">
          <strong>${escapeHtml(hero.name)}</strong>
          <small>${escapeHtml(hero.race)} · ${escapeHtml(hero.genderAge || '')} · ${escapeHtml(hero.job)}</small>
        </div>
        <span class="aura-badge">${escapeHtml(aura.label)}</span>
      </div>
      <div class="character-body">
        <p class="character-summary">${escapeHtml(hero.storyArc || '')}</p>
        <div class="chip-row">
          <span class="codex-chip">${escapeHtml(hero.role || '')}</span>
          <span class="codex-chip">${escapeHtml(hero.firstAppearance || '')}</span>
          ${(hero.specialization || []).slice(0, 4).map((item) => `<span class="codex-chip warn">${escapeHtml(item)}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}

function renderEnemyCard(enemy) {
  const aura = auraMeta[enemy.aura] || auraMeta['AURA-EVIL-DARKRED'];
  return `
    <article class="character-card" style="--aura-color:${aura.color}">
      <div class="character-head">
        <div class="character-name">
          <strong>${escapeHtml(enemy.name)}</strong>
          <small>${escapeHtml(enemy.race)} · ${escapeHtml(enemy.genderAge || '')} · ${escapeHtml(enemy.job)}</small>
        </div>
        <span class="aura-badge">${escapeHtml(aura.label)}</span>
      </div>
      <div class="character-body">
        <p class="character-summary">${escapeHtml(enemy.personalStory || enemy.motive || '')}</p>
        <div class="chip-row">
          <span class="codex-chip warn">${escapeHtml(enemy.firstAppearance || '')}</span>
          <span class="codex-chip">${escapeHtml(enemy.battleStyle || '')}</span>
          ${(enemy.threatType || []).map((item) => `<span class="codex-chip warn">${escapeHtml(item)}</span>`).join('')}
        </div>
        <p class="subtle">회유/분기: ${escapeHtml(enemy.conversionRoute || '없음')}</p>
      </div>
    </article>
  `;
}

function renderArcCard(arc) {
  const aura = auraMeta[arc.aura] || auraMeta['AURA-AMBIGUOUS-PURPLE'];
  return `
    <article class="character-card" style="--aura-color:${aura.color}">
      <div class="character-head">
        <div class="character-name">
          <strong>${escapeHtml(arc.name)}</strong>
          <small>${escapeHtml(arc.type)} · ${escapeHtml(arc.arcType)}</small>
        </div>
        <span class="aura-badge">${escapeHtml(aura.label)}</span>
      </div>
      <div class="character-body">
        <p class="character-summary">${escapeHtml(arc.personalConflict || '')}</p>
        <p class="subtle">성장 목표: ${escapeHtml(arc.growthGoal || '')}</p>
        <div class="chip-row">
          ${(arc.keyEvents || []).map((item) => `<span class="codex-chip">${escapeHtml(item)}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}

function getAuraLabel(auraId) {
  return auraMeta[auraId]?.label || auraId;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

boot().catch((error) => {
  listEl.innerHTML = `<div class="card warning"><p class="subtle">${escapeHtml(error.message)}</p></div>`;
});
