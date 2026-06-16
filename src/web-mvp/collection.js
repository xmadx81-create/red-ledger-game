const DATA_PATH = './data/';
const INV_KEY = 'hbh.inventory.v1';
const COLLECTION_KEY = 'hbh.collection.v1';
const GRADES = ['N', 'R', 'SR', 'EP', 'L'];

let styles = null;
let filter = 'ALL';
const els = {
  gradeSummary: document.querySelector('#grade-summary'),
  filterRow: document.querySelector('#filter-row'),
  cardGrid: document.querySelector('#card-grid'),
  colCount: document.querySelector('#col-count')
};

function loadJson(name) { return fetch(`${DATA_PATH}${name}`).then((r) => (r.ok ? r.json() : null)).catch(() => null); }
function loadInv() { try { const v = JSON.parse(localStorage.getItem(INV_KEY)); if (v && v.counts) return v.counts; } catch (e) { /* noop */ } return { N: 0, R: 0, SR: 0, EP: 0, L: 0 }; }
function loadCollection() { try { return JSON.parse(localStorage.getItem(COLLECTION_KEY)) || []; } catch (e) { return []; } }
function gradeColor(g) { const t = (styles && styles.rarityTiers || []).find((x) => x.rarityId === g); return t ? t.borderColor : '#999'; }
function gradeName(g) { const t = (styles && styles.rarityTiers || []).find((x) => x.rarityId === g); return t ? t.name : g; }

function render() {
  const counts = loadInv();
  const coll = loadCollection();

  els.gradeSummary.innerHTML = '';
  GRADES.forEach((g) => {
    const cell = document.createElement('div');
    cell.className = 'gs-cell';
    cell.style.setProperty('--g', gradeColor(g));
    cell.innerHTML = `<div class="gs-g">${g}</div><div class="gs-c">${counts[g] || 0}</div>`;
    els.gradeSummary.appendChild(cell);
  });

  // 필터(상위 등급만)
  const upper = ['ALL', 'R', 'SR', 'EP', 'L'];
  els.filterRow.innerHTML = '';
  upper.forEach((f) => {
    const b = document.createElement('button');
    b.className = filter === f ? 'on' : '';
    b.textContent = f === 'ALL' ? '전체' : f;
    b.addEventListener('click', () => { filter = f; render(); });
    els.filterRow.appendChild(b);
  });

  const shown = coll.filter((c) => filter === 'ALL' || c.grade === filter).slice().reverse();
  els.colCount.textContent = `(${coll.length}장)`;
  els.cardGrid.innerHTML = '';
  if (!shown.length) {
    els.cardGrid.innerHTML = '<div class="empty">아직 획득한 상위 카드가 없습니다. 합성소에서 합성에 성공하거나 전투 잭팟으로 얻으면 여기 쌓입니다.</div>';
    return;
  }
  shown.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'mini';
    div.style.setProperty('--g', gradeColor(c.grade));
    div.innerHTML = `<div class="mini-grade">${gradeName(c.grade)} (${c.grade})</div><div class="mini-name">${c.name}</div><div class="mini-via">${c.via || ''}</div>`;
    els.cardGrid.appendChild(div);
  });
}

async function boot() {
  styles = await loadJson('card-style-system.json');
  render();
}
boot();
