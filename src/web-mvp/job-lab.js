const DATA_PATH = './data/';
const STEP = 3; // 작업 1틱당 raise 스탯에 더해지는 포인트(제로섬으로 다른 스탯에서 차감)
const RACES = ['인간', '뱀파이어', '늑대인간', '드워프', '엘프', '골렘', '도깨비', '요괴'];
const PARTY_KEY = 'hbh.party.v1';
const INV_KEY = 'hbh.inventory.v1';
const PARTY_MAX = 3;

function defaultInv() {
  return { counts: { N: 30, R: 4, SR: 3, EP: 0, L: 0 }, pity: {}, attempts: 0, success: 0, madeL: 0 };
}
function loadInv() {
  try { const v = JSON.parse(localStorage.getItem(INV_KEY)); if (v && v.counts) return v; } catch (e) { /* noop */ }
  return defaultInv();
}
function saveInv(v) { localStorage.setItem(INV_KEY, JSON.stringify(v)); }

const els = {
  raceSelect: document.querySelector('#race-select'),
  gradeSelect: document.querySelector('#grade-select'),
  reset: document.querySelector('#reset'),
  budgetVal: document.querySelector('#budget-val'),
  budgetCheck: document.querySelector('#budget-check'),
  lockInfo: document.querySelector('#lock-info'),
  statList: document.querySelector('#stat-list'),
  locationList: document.querySelector('#location-list'),
  jobList: document.querySelector('#job-list'),
  selectedJob: document.querySelector('#selected-job'),
  cardName: document.querySelector('#card-name'),
  addParty: document.querySelector('#add-party'),
  partySaved: document.querySelector('#party-saved'),
  goBattle: document.querySelector('#go-battle'),
  invReadout: document.querySelector('#inv-readout'),
  grantN: document.querySelector('#grant-n')
};

function loadParty() {
  try { return JSON.parse(localStorage.getItem(PARTY_KEY)) || []; } catch (e) { return []; }
}
function saveParty(arr) { localStorage.setItem(PARTY_KEY, JSON.stringify(arr)); }

let schema = null;
let locations = [];
let jobs = [];
let state = null;

async function loadJson(name) {
  const res = await fetch(`${DATA_PATH}${name}`);
  if (!res.ok) throw new Error(`${name} 로딩 실패`);
  return res.json();
}

function statIds() { return schema.primaryStats.map((s) => s.statId); }
function statName(id) { return (schema.primaryStats.find((s) => s.statId === id) || {}).name || id; }
function floor() { return schema.statBudget.perStatFloor || 1; }
function budgetOf(grade) {
  const g = schema.statBudget.byGrade.find((b) => b.grade === grade);
  return g ? g.gradeBase : 100;
}
function lockSlotsOf(grade) {
  return (schema.lockSystem.lockSlotsByGrade && schema.lockSystem.lockSlotsByGrade[grade]) || 1;
}

function distributeEven(total, ids) {
  const n = ids.length;
  const base = Math.floor(total / n);
  let rem = total - base * n;
  const out = {};
  ids.forEach((id) => { out[id] = base + (rem-- > 0 ? 1 : 0); });
  return out;
}

function initState() {
  const grade = els.gradeSelect.value;
  const budget = budgetOf(grade);
  state = {
    race: els.raceSelect.value,
    grade,
    budget,
    stats: distributeEven(budget, statIds()),
    locked: new Set(),
    selectedJob: null
  };
  render();
}

function sumStats() { return statIds().reduce((a, id) => a + state.stats[id], 0); }

// 제로섬 포인트 이동: raise 스탯(잠금 아님)에 1포인트씩 더하고, 비-raise·비잠금·floor초과 스탯에서 1포인트씩 뺀다.
function placeOnce(loc) {
  const f = floor();
  const targets = loc.raise.filter((id) => !state.locked.has(id));
  if (!targets.length) return;
  const points = STEP * loc.raise.length;
  for (let p = 0; p < points; p++) {
    const donors = statIds().filter((id) => !loc.raise.includes(id) && !state.locked.has(id) && state.stats[id] > f);
    if (!donors.length) break;
    const donor = donors.sort((a, b) => state.stats[b] - state.stats[a])[0];
    const target = targets.slice().sort((a, b) => state.stats[a] - state.stats[b])[0];
    state.stats[donor] -= 1;
    state.stats[target] += 1;
  }
}

function place(loc, times) {
  for (let i = 0; i < times; i++) placeOnce(loc);
  state.selectedJob = null; // 스탯 변하면 후보 재산출
  render();
}

function toggleLock(id) {
  if (state.locked.has(id)) { state.locked.delete(id); }
  else {
    if (state.locked.size >= lockSlotsOf(state.grade)) return;
    state.locked.add(id);
  }
  render();
}

function jobMet(job) {
  return job.dominantStats.every((s) => state.stats[s] >= job.minShare * state.budget);
}

function selectJob(job) {
  if (!jobMet(job)) return;
  state.selectedJob = job;
  render();
}

function addToParty() {
  if (!state.selectedJob) return;
  const party = loadParty();
  if (party.length >= PARTY_MAX) return;
  const inv = loadInv();
  if ((inv.counts[state.grade] || 0) < 1) return; // 보유 카드 없으면 불가
  inv.counts[state.grade] -= 1;
  saveInv(inv);
  const name = (els.cardName.value || '').trim() || `${state.race} ${state.selectedJob.name}`;
  party.push({
    id: `LAB-${Date.now()}`,
    name,
    race: state.race,
    job: state.selectedJob.name,
    grade: state.grade,
    primary: { ...state.stats }
  });
  saveParty(party);
  els.cardName.value = '';
  renderInv();
  renderParty();
}

function removeFromParty(id) {
  saveParty(loadParty().filter((m) => m.id !== id));
  renderParty();
}

function renderInv() {
  const inv = loadInv();
  const order = ['N', 'R', 'SR', 'EP', 'L'];
  els.invReadout.innerHTML = '보유 카드 — ' + order.map((g) => `${g} <b>${inv.counts[g] || 0}</b>`).join(' · ') + ' <span style="opacity:.7">(합성소와 공유)</span>';
}

function grantN() {
  const inv = loadInv();
  inv.counts.N = (inv.counts.N || 0) + 5;
  saveInv(inv);
  renderInv();
  renderParty();
}

function renderParty() {
  const party = loadParty();
  const inv = loadInv();
  const owned = inv.counts[state.grade] || 0;
  const blocked = !state.selectedJob || party.length >= PARTY_MAX || owned < 1;
  els.addParty.disabled = blocked;
  els.addParty.textContent = party.length >= PARTY_MAX
    ? '파티가 가득 찼습니다 (3/3)'
    : (!state.selectedJob ? '먼저 직업을 선택하세요'
      : (owned < 1 ? `${state.grade} 카드 보유 0 (합성소에서 확보)` : `현재 카드를 파티에 추가 — ${state.grade} 1장 소비 (${party.length}/${PARTY_MAX})`));
  if (!party.length) {
    els.partySaved.innerHTML = '<div class="party-empty">담긴 카드 없음. 직업을 선택해 파티에 추가하세요.</div>';
  } else {
    els.partySaved.innerHTML = '';
    party.forEach((m) => {
      const div = document.createElement('div');
      div.className = 'party-member';
      div.innerHTML = `<span class="pm-name">${m.name}</span><span class="pm-sub">${m.race} · ${m.job} · ${m.grade}</span><button class="pm-rm">제거</button>`;
      div.querySelector('.pm-rm').addEventListener('click', () => removeFromParty(m.id));
      els.partySaved.appendChild(div);
    });
  }
  els.goBattle.classList.toggle('disabled', party.length === 0);
  els.goBattle.textContent = party.length ? `이 파티로 전투 시작 (${party.length}명) →` : '파티를 먼저 담으세요';
}

function render() {
  els.budgetVal.textContent = state.budget;
  const sum = sumStats();
  els.budgetCheck.textContent = `Σ = ${sum} ${sum === state.budget ? '(고정 유지)' : '(불일치!)'}`;
  els.budgetCheck.className = `budget-check ${sum === state.budget ? 'ok' : 'bad'}`;
  els.lockInfo.textContent = `잠금 ${state.locked.size}/${lockSlotsOf(state.grade)}`;

  // 스탯
  els.statList.innerHTML = '';
  statIds().forEach((id) => {
    const v = state.stats[id];
    const pct = Math.round((v / state.budget) * 100);
    const locked = state.locked.has(id);
    const row = document.createElement('div');
    row.className = `stat-row${locked ? ' locked' : ''}`;
    row.innerHTML = `
      <div class="stat-name">${statName(id)}<small>${id} · ${pct}%</small></div>
      <div class="stat-bar"><div class="stat-fill" style="width:${pct}%"></div></div>
      <div class="stat-val">${v}</div>
      <button class="lock-btn${locked ? ' locked' : ''}" title="감소 방지 잠금">${locked ? '🔒' : '🔓'}</button>
    `;
    row.querySelector('.lock-btn').addEventListener('click', () => toggleLock(id));
    els.statList.appendChild(row);
  });

  // 장소
  els.locationList.innerHTML = '';
  locations.forEach((loc) => {
    const div = document.createElement('div');
    div.className = 'loc';
    div.innerHTML = `
      <div class="loc-top">${loc.name}</div>
      <div class="loc-sub">작업: ${loc.activity}</div>
      <div class="loc-raise">${loc.raise.map((s) => `<span class="tag">${statName(s)}↑</span>`).join('')}</div>
      <div class="loc-btns"><button data-t="1">배치 ×1</button><button data-t="5">배치 ×5</button></div>
    `;
    div.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => place(loc, Number(b.dataset.t))));
    els.locationList.appendChild(div);
  });

  // 직업 후보
  els.selectedJob.innerHTML = state.selectedJob
    ? `선택된 직업: ✦ ${state.selectedJob.name} <span class="role">(${state.selectedJob.role || ''})</span>`
    : '<span class="none">아직 직업 미선택 — 스탯을 키워 후보를 띄우고 선택하세요.</span>';

  els.jobList.innerHTML = '';
  const sorted = jobs.slice().sort((a, b) => (jobMet(b) ? 1 : 0) - (jobMet(a) ? 1 : 0));
  sorted.forEach((job) => {
    const met = jobMet(job);
    const reqs = job.dominantStats.map((s) => {
      const need = Math.ceil(job.minShare * state.budget);
      const ok = state.stats[s] >= need;
      return `<span class="${ok ? 'hit' : 'miss'}">${statName(s)} ${state.stats[s]}/${need}</span>`;
    }).join(' · ');
    const div = document.createElement('div');
    div.className = `job${met ? ' met' : ''}`;
    div.innerHTML = `
      <div class="job-name">${job.name}<span class="role">${job.role || ''}</span></div>
      <div class="job-req">조건(${Math.round(job.minShare * 100)}%): ${reqs}</div>
      <button ${met ? '' : 'disabled'}>${met ? '이 직업 선택' : '조건 미충족'}</button>
    `;
    div.querySelector('button').addEventListener('click', () => selectJob(job));
    els.jobList.appendChild(div);
  });

  renderInv();
  renderParty();
}

async function boot() {
  [schema, locations, jobs] = await Promise.all([
    loadJson('card-stat-schema.json'),
    loadJson('placement-locations.json').then((d) => d.locations.filter((l) => (l.raise || []).length > 0)),
    loadJson('job-stat-profiles.json').then((d) => d.jobs)
  ]);

  els.raceSelect.innerHTML = RACES.map((r) => `<option>${r}</option>`).join('');
  els.gradeSelect.innerHTML = schema.statBudget.byGrade
    .map((g) => `<option value="${g.grade}">${g.grade} (총량 ${g.gradeBase})</option>`).join('');
  els.gradeSelect.value = 'SR';

  els.raceSelect.addEventListener('change', initState);
  els.gradeSelect.addEventListener('change', initState);
  els.reset.addEventListener('click', initState);
  els.addParty.addEventListener('click', addToParty);
  els.grantN.addEventListener('click', grantN);

  initState();
}

boot().catch((err) => { els.statList.innerHTML = `<p>${err.message}</p>`; });
