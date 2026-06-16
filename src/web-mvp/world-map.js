const DATA_PATH = './data/';
const CLEARED_KEY = 'hbh.cleared.v1';

let world = null;
const siteName = {};   // siteId -> 표시명
const els = { continents: document.querySelector('#continents'), reset: document.querySelector('#reset-progress') };

function loadJson(name) { return fetch(`${DATA_PATH}${name}`).then((r) => (r.ok ? r.json() : null)).catch(() => null); }
function loadCleared() { try { return new Set(JSON.parse(localStorage.getItem(CLEARED_KEY)) || []); } catch (e) { return new Set(); } }
function saveCleared(set) { localStorage.setItem(CLEARED_KEY, JSON.stringify([...set])); }

function siteType(id) {
  if (id === 'HUB') return 'HUB';
  if (id.startsWith('STG')) return 'STG';
  if (id.startsWith('DUN')) return 'DUN';
  if (id.startsWith('LOC')) return 'LOC';
  return 'STG';
}
function siteLabel(id) { return siteName[id] || id; }
function siteTypeName(t) { return ({ HUB: '센터 본부', STG: '전투 스테이지', DUN: '던전', LOC: '배치 장소' })[t] || t; }
function siteHref(id) {
  const t = siteType(id);
  if (t === 'HUB') return './hub.html';
  if (t === 'LOC') return './job-lab.html';
  return `./battle-prototype.html?stage=${encodeURIComponent(id)}`; // STG / DUN → 승리 시 해당 거점 클리어
}

function islandOpen(island, cleared) {
  return (island.unlock || []).every((req) => cleared.has(req));
}

function render() {
  const cleared = loadCleared();
  els.continents.innerHTML = '';
  (world.continents || []).forEach((cont) => {
    const contLocked = (cont.unlock || []).length > 0 && (cont.islands || []).length === 0;
    const div = document.createElement('div');
    div.className = `continent${contLocked ? ' locked' : ''}`;
    const band = (cont.difficultyBand || []).map((b) => `<span>${b}</span>`).join('');
    let html = `<div class="cont-top"><span class="cont-name">${cont.name}</span><span class="cont-theme">${cont.theme || ''}</span><span class="band">${band}</span></div>`;
    if (contLocked) html += `<div class="cont-lock">🔒 개방 조건: ${(cont.unlock || []).join(', ')}</div>`;
    html += '<div class="islands"></div>';
    div.innerHTML = html;
    const islandsWrap = div.querySelector('.islands');

    (cont.islands || []).forEach((isl) => {
      const open = islandOpen(isl, cleared);
      const idiv = document.createElement('div');
      idiv.className = `island${open ? '' : ' locked'}`;
      idiv.innerHTML = `
        <div class="isl-top"><span class="isl-name">${isl.name}</span><span class="isl-status ${open ? 'open' : 'locked'}">${open ? '개방' : '잠김'}</span></div>
        ${open ? '' : `<div class="isl-unlock">개방 조건: ${(isl.unlock || []).map(siteLabel).join(', ')} 클리어</div>`}
        <div class="sites"></div>`;
      const sitesWrap = idiv.querySelector('.sites');
      (isl.sites || []).forEach((sid) => {
        const t = siteType(sid);
        const done = cleared.has(sid);
        const sdiv = document.createElement('div');
        sdiv.className = `site t-${t}${open ? '' : ' locked'}${done ? ' cleared' : ''}`;
        let actions = open ? `<a href="${siteHref(sid)}">방문</a>` : '';
        if (open && t === 'STG') actions += `<button class="clear-btn${done ? ' done' : ''}" data-sid="${sid}">${done ? '✓ 클리어됨' : '클리어(데모)'}</button>`;
        sdiv.innerHTML = `<div class="site-name">${siteLabel(sid)}${done ? ' ✓' : ''}</div><div class="site-type">${siteTypeName(t)} · ${sid}</div><div class="site-actions">${actions}</div>`;
        const cb = sdiv.querySelector('.clear-btn');
        if (cb) cb.addEventListener('click', () => {
          const c = loadCleared();
          if (c.has(sid)) c.delete(sid); else c.add(sid);
          saveCleared(c); render();
        });
        sitesWrap.appendChild(sdiv);
      });
      islandsWrap.appendChild(idiv);
    });

    els.continents.appendChild(div);
  });
}

async function boot() {
  const [w, stages, dungeons, locations] = await Promise.all([
    loadJson('world-map.json'),
    loadJson('stages.json'),
    loadJson('dungeon-types.json'),
    loadJson('placement-locations.json')
  ]);
  world = w;
  siteName.HUB = '센터 본부(허브)';
  (stages || []).forEach((s) => { siteName[s.stageId] = s.stageName; });
  (dungeons || []).forEach((d) => { siteName[d.dungeonTypeId] = d.name; });
  ((locations && locations.locations) || []).forEach((l) => { siteName[l.locationId] = l.name; });
  els.reset.addEventListener('click', () => { saveCleared(new Set()); render(); });
  render();
}

boot().catch((err) => { els.continents.innerHTML = `<p>${err.message}</p>`; });
