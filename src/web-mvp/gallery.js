const DATA_PATH = './data/';
const els = {
  raceFilter: document.querySelector('#race-filter'),
  gradeFilter: document.querySelector('#grade-filter'),
  count: document.querySelector('#count'),
  grid: document.querySelector('#grid')
};

let styles = null;
let cards = [];
let raceFilter = 'all';
let gradeFilter = 'all';

const loadJson = (n) => fetch(`${DATA_PATH}${n}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);

function inferAlignment(a) {
  if (a === 'AURA-EVIL-DARKRED') return 'EVIL';
  if (a === 'AURA-AMBIGUOUS-PURPLE') return 'NEUTRAL';
  if (a === 'AURA-LEGEND-GOLD') return 'LEGEND';
  return 'GOOD';
}
function inferRarity(a) {
  if (a === 'AURA-LEGEND-GOLD') return 'L';
  if (a === 'AURA-AMBIGUOUS-PURPLE') return 'EP';
  if (a === 'AURA-EVIL-DARKRED') return 'SR';
  return 'R';
}
const tier = (g) => (styles.rarityTiers || []).find((t) => t.rarityId === g) || styles.rarityTiers[0];
function auraColor(alignment, rarity) {
  const id = rarity === 'L' ? 'LEGEND' : alignment;
  const a = (styles.alignmentAuras || []).find((x) => x.alignmentId === id);
  return a ? a.auraColor : '#888';
}
function auraName(alignment, rarity) {
  const id = rarity === 'L' ? 'LEGEND' : alignment;
  const a = (styles.alignmentAuras || []).find((x) => x.alignmentId === id);
  return a ? a.name : alignment;
}

function build(heroData, enemyData, registry) {
  const regMap = new Map((registry.cards || []).map((c) => [c.characterId, c]));
  const out = [];
  for (const race of (heroData.races || [])) {
    for (const h of (race.heroes || [])) {
      const reg = regMap.get(h.id) || {};
      const rarity = reg.rarity || inferRarity(h.aura);
      out.push({
        id: h.id, name: h.name, race: race.raceName, job: h.job, role: h.role,
        rarity, alignment: reg.alignment || inferAlignment(h.aura), enemy: false
      });
    }
  }
  for (const e of (enemyData.enemyHeroes || [])) {
    out.push({
      id: e.id, name: e.name, race: e.race, job: e.job,
      role: (e.threatType || [])[0] || '적 영웅',
      rarity: inferRarity(e.aura), alignment: inferAlignment(e.secondaryAura || e.aura), enemy: true
    });
  }
  return out;
}

function render() {
  const shown = cards.filter((c) => (raceFilter === 'all' || c.race === raceFilter) && (gradeFilter === 'all' || c.rarity === gradeFilter));
  els.count.textContent = `${shown.length}장 / 전체 ${cards.length}장`;
  els.grid.innerHTML = '';
  shown.forEach((c) => {
    const t = tier(c.rarity);
    const aura = auraColor(c.alignment, c.rarity);
    const stars = '★'.repeat(t.starCount) + '☆'.repeat(Math.max(0, 5 - t.starCount));
    const div = document.createElement('div');
    div.className = 'card';
    div.style.setProperty('--b', t.borderColor);
    div.style.setProperty('--aura', aura);
    div.innerHTML = `
      <div class="badge">${c.rarity}</div>
      ${c.enemy ? '<span class="enemy-flag">적</span>' : ''}
      <div class="slot"><span class="initial">${(c.name || '?').slice(0, 1)}</span><span class="ph">일러스트 준비중</span></div>
      <div class="nm">${c.name}</div>
      <div class="sub">${c.race} · ${c.job}</div>
      <div class="role">${c.role || ''}</div>
      <div class="stars">${stars}</div>
      <span class="aura-tag">${auraName(c.alignment, c.rarity)}</span>
    `;
    els.grid.appendChild(div);
  });
}

async function boot() {
  const [style, hero, enemy, registry] = await Promise.all([
    loadJson('card-style-system.json'),
    loadJson('hero-roster-by-race.json'),
    loadJson('enemy-hero-roster.json'),
    loadJson('character-card-registry.json')
  ]);
  styles = style;
  cards = build(hero || { races: [] }, enemy || { enemyHeroes: [] }, registry || { cards: [] });

  const races = ['all', ...[...new Set(cards.map((c) => c.race))]];
  els.raceFilter.innerHTML = races.map((r) => `<option value="${r}">${r === 'all' ? '전체 종족' : r}</option>`).join('');
  const grades = ['all', 'N', 'R', 'SR', 'EP', 'L'];
  els.gradeFilter.innerHTML = grades.map((g) => `<option value="${g}">${g === 'all' ? '전체 등급' : g}</option>`).join('');
  els.raceFilter.addEventListener('change', () => { raceFilter = els.raceFilter.value; render(); });
  els.gradeFilter.addEventListener('change', () => { gradeFilter = els.gradeFilter.value; render(); });

  render();
}

boot().catch((e) => { els.grid.innerHTML = `<p>${e.message}</p>`; });
