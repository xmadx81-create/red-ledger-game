const DATA_PATH = './data/';
const els = {
  raceFilter: document.querySelector('#race-filter'),
  gradeFilter: document.querySelector('#grade-filter'),
  count: document.querySelector('#count'),
  grid: document.querySelector('#grid')
};

let styles = null;
let auraSys = null;
let cards = [];
let raceFilter = 'all';
let gradeFilter = 'all';

// 보유 자산(개별 초상)을 카드에 임시 적용 — 기존 구 시뮬 PNG 차용
const PORTRAIT = {
  'HUM-001': 'seo_yoonjae.png',
  'HUM-005': 'jung_harin.png',
  'HUM-004': 'kim_dohyun.png',
  'HUM-003': 'park_seyeon.png',
  'VMP-002': 'elliot_cartein.png'
};

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
function auraEntry(alignment, rarity) {
  const id = rarity === 'L' ? 'LEGEND' : alignment;
  return (styles.alignmentAuras || []).find((x) => x.alignmentId === id) || {};
}
function auraEffects(auraId) {
  const a = (auraSys.auraTypes || []).find((x) => x.auraId === auraId);
  return a ? (a.gameEffect || []) : [];
}

// 역할/직업 키워드 → 1차 스탯 가중치
function weights(text) {
  const w = { STR: 1, DEX: 1, INT: 1, VIT: 1, ACC: 1, CHA: 1, WIL: 1, LUK: 1 };
  const t = text || '';
  if (/격투|근접|체술|전사|파이터|폭발|딜러|제압|버서커|선봉|전투/.test(t)) { w.STR += 4; w.VIT += 2; }
  if (/수송|회피|기동|잠입|은폐|정찰|추적|스카우트|배달|아처|궁|사격|로그|암살/.test(t)) { w.DEX += 4; w.ACC += 2; }
  if (/마법|위저드|술사|환영|지배|해독|기록|분석|연구|혈액술|아케인|룬|메이지|연금|키메라/.test(t)) { w.INT += 4; }
  if (/방호|방어|탱|보호|수호|구조|성벽|가디언|방패|센티널/.test(t)) { w.VIT += 4; w.STR += 2; }
  if (/협상|상담|외교|지원|치유|회복|힐|간호|진정|의무/.test(t)) { w.CHA += 4; w.INT += 1; }
  if (/명중|저격|정밀|감지|혈향|헌터/.test(t)) { w.ACC += 3; }
  if (/정신|의지|저주|샤먼|오라클|예언|환각/.test(t)) { w.WIL += 3; }
  if (/행운|운|점복|트릭|럭키/.test(t)) { w.LUK += 3; }
  return w;
}
function primaryFrom(budget, text) {
  const w = weights(text);
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  const ids = Object.keys(w);
  const out = {};
  let used = 0;
  ids.forEach((k) => { out[k] = Math.max(1, Math.round(budget * w[k] / sum)); used += out[k]; });
  out.STR += (budget - used); // 잔차 보정
  if (out.STR < 1) out.STR = 1;
  return out;
}
function derive(p) {
  return {
    HP: Math.round(p.VIT * 8 + p.STR * 2),
    물공: Math.round(p.STR * 2 + p.DEX * 0.5),
    기공: Math.round(p.INT * 2 + p.ACC * 0.5),
    방어: Math.round(p.VIT * 1.5 + p.STR * 0.5),
    속도: Math.round(p.DEX * 2),
    명중: Math.round(p.ACC * 1.5 + p.DEX * 0.5),
    회피: Math.round(p.DEX * 1.2),
    치명: Math.round(p.ACC * 0.7 + p.LUK * 0.8)
  };
}

function build(heroData, enemyData, registry, budgetByGrade) {
  const regMap = new Map((registry.cards || []).map((c) => [c.characterId, c]));
  const out = [];
  const push = (o) => {
    const text = `${o.job} ${o.role}`;
    const budget = (budgetByGrade[o.rarity] || 100);
    o.derived = derive(primaryFrom(budget, text));
    out.push(o);
  };
  for (const race of (heroData.races || [])) {
    for (const h of (race.heroes || [])) {
      const reg = regMap.get(h.id) || {};
      push({
        id: h.id, name: h.name, race: race.raceName, job: h.job, role: h.role,
        rarity: reg.rarity || inferRarity(h.aura), alignment: reg.alignment || inferAlignment(h.aura),
        aura: h.aura, story: h.storyArc || '', enemy: false
      });
    }
  }
  for (const e of (enemyData.enemyHeroes || [])) {
    push({
      id: e.id, name: e.name, race: e.race, job: e.job, role: (e.threatType || [])[0] || '적 영웅',
      rarity: inferRarity(e.aura), alignment: inferAlignment(e.secondaryAura || e.aura),
      aura: e.aura, story: e.personalStory || e.motive || '', enemy: true
    });
  }
  return out;
}

function render() {
  const shown = cards.filter((c) => (raceFilter === 'all' || c.race === raceFilter) && (gradeFilter === 'all' || c.rarity === gradeFilter));
  els.count.textContent = `${shown.length}장 / 전체 ${cards.length}장 · 카드를 누르면 뒷면`;
  els.grid.innerHTML = '';
  shown.forEach((c) => {
    const t = tier(c.rarity);
    const aE = auraEntry(c.alignment, c.rarity);
    const aura = aE.auraColor || '#888';
    const stars = '★'.repeat(t.starCount) + '☆'.repeat(Math.max(0, 5 - t.starCount));
    const portrait = PORTRAIT[c.id];
    const d = c.derived;
    const effects = auraEffects(c.aura);

    const wrap = document.createElement('div');
    wrap.className = 'flip';
    wrap.style.setProperty('--b', t.borderColor);
    wrap.style.setProperty('--aura', aura);
    wrap.innerHTML = `
      <div class="flip-inner">
        <div class="face front">
          <div class="badge">${c.rarity}</div>
          ${c.enemy ? '<span class="enemy-flag">적</span>' : ''}
          <div class="slot">
            ${portrait
              ? `<img src="./assets/portraits/${portrait}" alt="${c.name}" loading="lazy" /><span class="ph real">임시 일러스트</span>`
              : `<span class="initial">${(c.name || '?').slice(0, 1)}</span><span class="ph">일러스트 준비중</span>`}
          </div>
          <div class="nm">${c.name}</div>
          <div class="sub">${c.race} · ${c.job}</div>
          <div class="stars">${stars} <span class="flip-hint">뒤집기 ⟳</span></div>
        </div>
        <div class="face back">
          <div class="bk-title">${c.name} <span>${t.name}(${c.rarity})</span></div>
          <div class="bk-sub">${c.race} · ${c.job} · ${c.role}</div>
          <div class="stat-grid">
            ${Object.entries(d).map(([k, v]) => `<div class="st"><span>${k}</span><b>${v}</b></div>`).join('')}
          </div>
          <div class="bk-sec">아우라 효과 (${aE.name || ''})</div>
          <ul class="fx">${effects.length ? effects.map((e) => `<li>${e}</li>`).join('') : '<li>—</li>'}</ul>
          <div class="bk-sec">스토리</div>
          <p class="story">${c.story || '—'}</p>
        </div>
      </div>`;
    wrap.addEventListener('click', () => wrap.classList.toggle('flipped'));
    els.grid.appendChild(wrap);
  });
}

async function boot() {
  const [style, aura, hero, enemy, registry, stat] = await Promise.all([
    loadJson('card-style-system.json'),
    loadJson('aura-system.json'),
    loadJson('hero-roster-by-race.json'),
    loadJson('enemy-hero-roster.json'),
    loadJson('character-card-registry.json'),
    loadJson('card-stat-schema.json')
  ]);
  styles = style;
  auraSys = aura || { auraTypes: [] };
  const budgetByGrade = {};
  for (const g of (stat.statBudget?.byGrade || [])) budgetByGrade[g.grade] = g.gradeBase;
  cards = build(hero || { races: [] }, enemy || { enemyHeroes: [] }, registry || { cards: [] }, budgetByGrade);

  const races = ['all', ...[...new Set(cards.map((c) => c.race))]];
  els.raceFilter.innerHTML = races.map((r) => `<option value="${r}">${r === 'all' ? '전체 종족' : r}</option>`).join('');
  els.gradeFilter.innerHTML = ['all', 'N', 'R', 'SR', 'EP', 'L'].map((g) => `<option value="${g}">${g === 'all' ? '전체 등급' : g}</option>`).join('');
  els.raceFilter.addEventListener('change', () => { raceFilter = els.raceFilter.value; render(); });
  els.gradeFilter.addEventListener('change', () => { gradeFilter = els.gradeFilter.value; render(); });
  render();
}

boot().catch((e) => { els.grid.innerHTML = `<p>${e.message}</p>`; });
