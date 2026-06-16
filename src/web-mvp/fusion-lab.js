const DATA_PATH = './data/';
const INV_KEY = 'hbh.inventory.v1';

const els = {
  invRow: document.querySelector('#inv-row'),
  grantN: document.querySelector('#grant-n'),
  resetInv: document.querySelector('#reset-inv'),
  statsRow: document.querySelector('#stats-row'),
  jumpList: document.querySelector('#jump-list'),
  log: document.querySelector('#log')
};

let tree = null;
let styles = null;
let inv = null;
const GRADES = ['N', 'R', 'SR', 'EP', 'L'];

async function loadJson(name) {
  const res = await fetch(`${DATA_PATH}${name}`);
  if (!res.ok) throw new Error(`${name} 로딩 실패`);
  return res.json();
}

function defaultInv() {
  return {
    counts: { N: 30, R: 4, SR: 3, EP: 0, L: 0 },
    pity: {},      // jumpKey -> 연속 실패 수
    attempts: 0,
    success: 0,
    madeL: 0
  };
}
function loadInv() {
  try {
    const v = JSON.parse(localStorage.getItem(INV_KEY));
    if (v && v.counts) return v;
  } catch (e) { /* noop */ }
  return defaultInv();
}
function saveInv() { localStorage.setItem(INV_KEY, JSON.stringify(inv)); }

function tierOf(g) { return (styles.rarityTiers || []).find((t) => t.rarityId === g) || {}; }
function jumpKey(j) { return `${j.from}->${j.to}`; }

function addLog(text, cls = '') {
  const div = document.createElement('div');
  div.className = `line ${cls}`;
  div.textContent = text;
  els.log.appendChild(div);
}

function effectiveRate(j) {
  const fails = inv.pity[jumpKey(j)] || 0;
  if (fails + 1 >= j.pityCap) return 1; // 천장: 다음 시도 확정 성공
  return j.baseSuccessRate;
}

function canAttempt(j) {
  // 베이스 1 + 재료(fodderPerAttempt) 만큼의 from 등급 카드 필요
  return inv.counts[j.from] >= 1 + j.fodderPerAttempt;
}

function attempt(j) {
  if (!canAttempt(j)) return;
  const key = jumpKey(j);
  const guaranteed = (inv.pity[key] || 0) + 1 >= j.pityCap;
  // 재료 소모(실패해도 소모)
  inv.counts[j.from] -= j.fodderPerAttempt;
  inv.attempts += 1;
  const rate = effectiveRate(j);
  const roll = Math.random();
  if (roll < rate) {
    // 성공: 베이스 1장이 상위 등급으로
    inv.counts[j.from] -= 1;
    inv.counts[j.to] += 1;
    inv.pity[key] = 0;
    inv.success += 1;
    const tName = tierOf(j.to).name || j.to;
    if (j.to === 'L') { inv.madeL += 1; addLog(`★☆★ 전설(${tName}) 카드 탄생!! ${guaranteed ? '(천장 확정)' : `(${Math.round(j.baseSuccessRate * 100)}% 돌파!)`}`, 'big'); }
    else addLog(`합성 성공! ${j.from} → ${tName}(${j.to}) ${guaranteed ? '(천장 확정)' : ''}`, 'ok');
  } else {
    inv.pity[key] = (inv.pity[key] || 0) + 1;
    addLog(`합성 실패… ${j.from}→${j.to} (천장 ${inv.pity[key]}/${j.pityCap}, 재료 ${j.fodderPerAttempt} 소모)`, 'fail');
  }
  saveInv();
  render();
}

function grantN() {
  inv.counts.N += 5;
  saveInv();
  addLog('일반(N) 카드 5장 획득 (출석/사냥 시뮬).', 'sys');
  render();
}

function resetInv() { inv = defaultInv(); saveInv(); els.log.innerHTML = ''; addLog('보유 카드를 초기화했습니다.', 'sys'); render(); }

function render() {
  // 인벤토리
  els.invRow.innerHTML = '';
  GRADES.forEach((g) => {
    const t = tierOf(g);
    const cell = document.createElement('div');
    cell.className = 'inv-cell';
    cell.style.setProperty('--g', t.borderColor || '#999');
    cell.innerHTML = `<div class="inv-grade">${g}</div><div class="inv-name">${t.name || ''}</div><div class="inv-count">${inv.counts[g]}</div>`;
    els.invRow.appendChild(cell);
  });

  const rate = inv.attempts ? Math.round((inv.success / inv.attempts) * 100) : 0;
  els.statsRow.textContent = `총 시도 ${inv.attempts}회 · 성공 ${inv.success}회 (성공률 ${rate}%) · 전설 제작 ${inv.madeL}장`;

  // 도약 패널
  els.jumpList.innerHTML = '';
  (tree.jumps || []).forEach((j) => {
    const key = jumpKey(j);
    const fails = inv.pity[key] || 0;
    const guaranteed = fails + 1 >= j.pityCap;
    const rateShown = guaranteed ? '확정(천장)' : `${Math.round(j.baseSuccessRate * 100)}%`;
    const tFrom = tierOf(j.from).name || j.from;
    const tTo = tierOf(j.to).name || j.to;
    const need = 1 + j.fodderPerAttempt;
    const ok = canAttempt(j);
    const div = document.createElement('div');
    div.className = 'jump';
    div.innerHTML = `
      <div class="jump-info">
        <div class="jump-title">${tFrom}(${j.from}) → ${tTo}(${j.to})</div>
        <div class="jump-meta">성공률 ${rateShown} · 필요 ${j.from} 카드 ${need}장(베이스1+재료${j.fodderPerAttempt})</div>
        <div class="jump-pity">천장 ${fails}/${j.pityCap}</div>
        <div class="pity-bar"><div class="pity-fill" style="width:${Math.round((fails / j.pityCap) * 100)}%"></div></div>
      </div>
      <button ${ok ? '' : 'disabled'} class="${guaranteed ? 'guaranteed' : ''}">${ok ? '합성 시도' : `${j.from} 부족`}</button>
    `;
    div.querySelector('button').addEventListener('click', () => attempt(j));
    els.jumpList.appendChild(div);
  });
}

async function boot() {
  [tree, styles] = await Promise.all([
    loadJson('fusion-recipe-tree.json'),
    loadJson('card-style-system.json')
  ]);
  inv = loadInv();
  els.grantN.addEventListener('click', grantN);
  els.resetInv.addEventListener('click', resetInv);
  render();
}

boot().catch((err) => { els.jumpList.innerHTML = `<p>${err.message}</p>`; });
