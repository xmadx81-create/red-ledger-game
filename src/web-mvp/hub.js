const INV_KEY = 'hbh.inventory.v1';
const PARTY_KEY = 'hbh.party.v1';
const GRADES = ['N', 'R', 'SR', 'EP', 'L'];
const GRADE_COLOR = { N: '#8f8f8f', R: '#0f7d57', SR: '#1769d1', EP: '#7a35d8', L: '#c79524' };

function readInv() {
  try { const v = JSON.parse(localStorage.getItem(INV_KEY)); if (v && v.counts) return v.counts; } catch (e) { /* noop */ }
  return { N: 30, R: 4, SR: 3, EP: 0, L: 0 }; // 기본값(합성소/육성소와 동일)
}
function readParty() {
  try { return JSON.parse(localStorage.getItem(PARTY_KEY)) || []; } catch (e) { return []; }
}

function render() {
  const counts = readInv();
  const party = readParty();

  const inv = document.querySelector('#inv-summary');
  inv.innerHTML = '';
  GRADES.forEach((g) => {
    const pill = document.createElement('div');
    pill.className = 'inv-pill';
    pill.style.setProperty('--g', GRADE_COLOR[g]);
    pill.innerHTML = `<span class="g">${g}</span><span class="c">${counts[g] || 0}</span>`;
    inv.appendChild(pill);
  });

  const ps = document.querySelector('#party-summary');
  if (!party.length) {
    ps.innerHTML = '<div class="empty">아직 파티 없음 — 배치 육성소에서 카드를 키워 담으세요.</div>';
  } else {
    ps.innerHTML = party.map((m) => `<div class="pm">${m.name} <small>· ${m.race} ${m.job} (${m.grade})</small></div>`).join('');
  }

  const hint = document.querySelector('#hint');
  const totalCards = GRADES.reduce((a, g) => a + (counts[g] || 0), 0);
  if (party.length >= 1) {
    hint.className = 'hub-hint go';
    hint.textContent = `전투 준비 완료! 파티 ${party.length}명으로 전투(STEP 3)에 출전할 수 있어요.`;
  } else if (totalCards > 0) {
    hint.className = 'hub-hint todo';
    hint.textContent = '보유 카드가 있어요. STEP 2 배치 육성소에서 카드를 키워 직업을 주고 파티에 담으세요.';
  } else {
    hint.className = 'hub-hint todo';
    hint.textContent = 'STEP 1 합성소에서 일반 카드를 받고 합성으로 카드를 모으는 것부터 시작하세요.';
  }
}

render();
