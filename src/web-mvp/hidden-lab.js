const DATA_PATH = './data/';
const HIDDEN_KEY = 'hbh.hidden.v1';

const els = {
  chainSelect: document.querySelector('#chain-select'),
  goal: document.querySelector('#goal'),
  owned: document.querySelector('#owned'),
  steps: document.querySelector('#steps'),
  log: document.querySelector('#log'),
  refill: document.querySelector('#refill'),
  reset: document.querySelector('#reset')
};

let chains = [];
let chain = null;
let leaves = [];   // 결과가 아닌 입력(보충 대상)
let allOwned = {}; // { [chainId]: {cardId:count} }
let owned = {};    // 현재 체인의 보유(allOwned 참조)
let labels = {};
function lbl(id) { return labels[id] || id; }

function loadAll() { try { return JSON.parse(localStorage.getItem(HIDDEN_KEY)) || {}; } catch (e) { return {}; } }
function saveOwned() { localStorage.setItem(HIDDEN_KEY, JSON.stringify(allOwned)); }

function computeLeaves(ch) {
  const results = new Set(ch.steps.map((s) => s.result));
  return [...new Set(ch.steps.flatMap((s) => s.inputs))].filter((id) => !results.has(id));
}

function selectChain(idx) {
  chain = chains[idx];
  leaves = computeLeaves(chain);
  if (!allOwned[chain.chainId]) { allOwned[chain.chainId] = {}; leaves.forEach((id) => { allOwned[chain.chainId][id] = 3; }); saveOwned(); }
  owned = allOwned[chain.chainId];
  addLog(`비공개 체인 [${chain.name}] 선택. 목표: ${lbl(chain.steps[chain.steps.length - 1].result)}`, 'sys');
  render();
}

function addLog(t, c = '') { const d = document.createElement('div'); d.className = `line ${c}`; d.textContent = t; els.log.appendChild(d); }

function refill() {
  leaves.forEach((id) => { owned[id] = (owned[id] || 0) + 3; });
  saveOwned();
  addLog('리프 재료를 3개씩 보충했습니다.', 'sys');
  render();
}

function resetAll() {
  allOwned[chain.chainId] = {};
  leaves.forEach((id) => { allOwned[chain.chainId][id] = 3; });
  owned = allOwned[chain.chainId];
  saveOwned();
  els.log.innerHTML = '';
  addLog('현재 체인 초기화 — 리프 재료 3개씩 지급.', 'sys');
  render();
}

function attempt(step) {
  const [a, b] = step.inputs;
  if ((owned[a] || 0) < 1 || (owned[b] || 0) < 1) return;
  owned[a] -= 1; owned[b] -= 1;
  const isLegend = step.toGrade === 'L';
  if (Math.random() < step.successRate) {
    owned[step.result] = (owned[step.result] || 0) + 1;
    if (isLegend) addLog(`★☆★ 비공개 루트로 전설 [${lbl(step.result)}] 각성 성공!!`, 'big');
    else addLog(`히든 합성 성공! ${step.fromGrade}→${step.toGrade}: [${lbl(step.result)}] 생성 (50%)`, 'ok');
  } else {
    addLog(`히든 합성 실패… ${step.fromGrade}→${step.toGrade} (${lbl(a)}, ${lbl(b)} 소모)`, 'fail');
  }
  saveOwned();
  render();
}

function render() {
  const finalResult = chain.steps[chain.steps.length - 1].result;
  const haveLegend = (owned[finalResult] || 0) >= 1;
  els.goal.className = `hl-goal${haveLegend ? ' done' : ''}`;
  els.goal.textContent = haveLegend
    ? `🏆 전설 [${lbl(finalResult)}] 보유! 비공개 최단 루트 완성`
    : `🎯 목표: 전설 [${lbl(finalResult)}] 각성 — 비공개 조합을 연쇄하세요`;

  // 보유 재료
  const ids = [...new Set([...leaves, ...chain.steps.map((s) => s.result)])];
  els.owned.innerHTML = '';
  ids.forEach((id) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${lbl(id)} <b>${owned[id] || 0}</b>`;
    els.owned.appendChild(chip);
  });

  // 체인 단계
  els.steps.innerHTML = '';
  chain.steps.forEach((step) => {
    const [a, b] = step.inputs;
    const can = (owned[a] || 0) >= 1 && (owned[b] || 0) >= 1;
    const div = document.createElement('div');
    div.className = `step${can ? ' ready' : ''}`;
    const ioA = `<span class="io ${(owned[a] || 0) >= 1 ? 'have' : 'miss'}">${lbl(a)} (${owned[a] || 0})</span>`;
    const ioB = `<span class="io ${(owned[b] || 0) >= 1 ? 'have' : 'miss'}">${lbl(b)} (${owned[b] || 0})</span>`;
    div.innerHTML = `
      <div class="step-line">${ioA}<span class="arrow">＋</span>${ioB}<span class="arrow">→</span><span class="io result">${lbl(step.result)}</span></div>
      <div class="rate">${step.fromGrade} → ${step.toGrade} · 성공률 ${Math.round(step.successRate * 100)}%</div>
      <button ${can ? '' : 'disabled'}>${can ? '히든 합성 시도' : '재료 부족'}</button>`;
    div.querySelector('button').addEventListener('click', () => attempt(step));
    els.steps.appendChild(div);
  });
}

async function boot() {
  const res = await fetch(`${DATA_PATH}hidden-fusion-recipes.json`);
  if (!res.ok) { els.steps.innerHTML = '<p>hidden-fusion-recipes.json 로딩 실패</p>'; return; }
  const data = await res.json();
  labels = data.cardLabels || {};
  chains = data.chains || [];
  allOwned = loadAll();

  els.chainSelect.innerHTML = chains.map((c, i) => `<option value="${i}">${c.name} → ${lbl(c.steps[c.steps.length - 1].result)}</option>`).join('');
  els.chainSelect.addEventListener('change', () => selectChain(Number(els.chainSelect.value)));
  els.refill.addEventListener('click', refill);
  els.reset.addEventListener('click', resetAll);

  selectChain(0);
}

boot();
