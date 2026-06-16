const DATA_PATH = './data/';
const STEP = 3; // 작업 1틱당 raise 스탯에 더해지는 포인트(제로섬으로 다른 스탯에서 차감)
const RACES = ['인간', '뱀파이어', '늑대인간', '드워프', '엘프', '골렘', '도깨비', '요괴'];

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
  selectedJob: document.querySelector('#selected-job')
};

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
  els.gradeSelect.value = 'R';

  els.raceSelect.addEventListener('change', initState);
  els.gradeSelect.addEventListener('change', initState);
  els.reset.addEventListener('click', initState);

  initState();
}

boot().catch((err) => { els.statList.innerHTML = `<p>${err.message}</p>`; });
