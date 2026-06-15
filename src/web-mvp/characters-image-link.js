const IMAGE_MAP_PATH = './data/character-image-map.json';

let imageMap = null;

async function loadImageMap() {
  try {
    const response = await fetch(IMAGE_MAP_PATH);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function getAssetGroup(assetGroupId) {
  if (!imageMap || !assetGroupId) return null;
  return (imageMap.imageAssetGroups || []).find((group) => group.assetGroupId === assetGroupId) || null;
}

function resolveAssetForCard(card) {
  if (!imageMap) return null;
  const name = card.querySelector('.character-name strong')?.textContent?.trim();
  const meta = card.querySelector('.character-name small')?.textContent || '';

  if (!name) return null;

  const normalized = `${name} ${meta}`;
  const isEnemy = normalized.includes('적') || normalized.includes('보스') || normalized.includes('전략 지휘관') || normalized.includes('밤의 귀족');
  const isGolem = normalized.includes('골렘');
  const isStaff = normalized.includes('간호사') || normalized.includes('NPC');
  const isVampireVillain = isEnemy && (normalized.includes('뱀프') || normalized.includes('뱀파이어'));

  if (isVampireVillain) return getAssetGroup('IMG-VAMPIRE-VILLAIN-001');
  if (isEnemy) return getAssetGroup('IMG-ENEMY-HERO-001');
  if (isGolem) return getAssetGroup('IMG-GOLEM-HERO-001');
  if (isStaff) return getAssetGroup('IMG-STAFF-NPC-001');
  return getAssetGroup('IMG-HERO-ROSTER-001');
}

function createThumb(asset) {
  const wrap = document.createElement('div');
  wrap.className = 'codex-thumb mapped';

  const image = document.createElement('img');
  image.src = asset.plannedWebPath;
  image.alt = asset.title;
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    wrap.classList.add('missing');
  });

  const label = document.createElement('div');
  label.className = 'codex-thumb-label';
  label.innerHTML = `<strong>${escapeText(asset.title)}</strong><small>${escapeText(asset.sourceFileName)}</small>`;

  wrap.appendChild(image);
  wrap.appendChild(label);
  return wrap;
}

function injectImageSlots() {
  if (!imageMap) return;
  const cards = [...document.querySelectorAll('.character-card')];

  cards.forEach((card) => {
    if (card.querySelector('.codex-thumb')) return;
    const asset = resolveAssetForCard(card);
    if (!asset) return;
    card.prepend(createThumb(asset));
  });
}

function escapeText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function bootImageLinker() {
  imageMap = await loadImageMap();
  if (!imageMap) return;

  injectImageSlots();

  const list = document.querySelector('#codex-list');
  if (!list) return;
  const observer = new MutationObserver(() => injectImageSlots());
  observer.observe(list, { childList: true, subtree: true });
}

bootImageLinker();
