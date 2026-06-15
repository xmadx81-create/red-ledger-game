const DATA_PATH = './data/';

const state = {
  characters: [],
  styles: null,
  selectedId: null,
  selectedRarity: null
};

const selectEl = document.querySelector('#character-select');
const rarityEl = document.querySelector('#rarity-select');
const previewEl = document.querySelector('#card-preview');

async function loadJson(fileName) {
  const response = await fetch(`${DATA_PATH}${fileName}`);
  if (!response.ok) throw new Error(`${fileName} 로딩 실패`);
  return response.json();
}

async function boot() {
  const [styleData, heroData, enemyData, registryData] = await Promise.all([
    loadJson('card-style-system.json'),
    loadJson('hero-roster-by-race.json'),
    loadJson('enemy-hero-roster.json'),
    loadJson('character-card-registry.json')
  ]);

  state.styles = styleData;
  state.characters = buildCharacters(heroData, enemyData, registryData);
  state.selectedId = state.characters[0]?.characterId;
  state.selectedRarity = state.characters[0]?.rarity || 'N';

  fillControls();
  bindEvents();
  render();
}

function buildCharacters(heroData, enemyData, registryData) {
  const registryMap = new Map((registryData.cards || []).map((card) => [card.characterId, card]));

  const heroes = (heroData.races || []).flatMap((race) => {
    return (race.heroes || []).map((hero) => {
      const registered = registryMap.get(hero.id) || {};
      const rarity = registered.rarity || inferRarity(hero.aura);
      return normalizeCharacter({
        cardUid: registered.cardUid || buildCardUid(hero.id, rarity, registered.serial || 1),
        characterId: hero.id,
        name: hero.name,
        race: race.raceName,
        job: hero.job,
        role: hero.role,
        alignment: registered.alignment || inferAlignment(hero.aura),
        rarity,
        serial: registered.serial || 1,
        story: hero.storyArc,
        firstAppearance: hero.firstAppearance,
        tags: [hero.job, hero.role, ...(race.specialization || [])].filter(Boolean).slice(0, 5),
        sourceType: 'hero'
      });
    });
  });

  const enemies = (enemyData.enemyHeroes || []).map((enemy) => {
    const rarity = inferRarity(enemy.aura);
    return normalizeCharacter({
      cardUid: buildCardUid(enemy.id, rarity, 1),
      characterId: enemy.id,
      name: enemy.name,
      race: enemy.race,
      job: enemy.job,
      role: enemy.threatType?.[0] || '적 영웅',
      alignment: inferAlignment(enemy.secondaryAura || enemy.aura),
      rarity,
      serial: 1,
      story: enemy.personalStory || enemy.motive,
      firstAppearance: enemy.firstAppearance,
      tags: [enemy.job, ...(enemy.threatType || [])].filter(Boolean).slice(0, 5),
      sourceType: 'enemy'
    });
  });

  return [...heroes, ...enemies];
}

function normalizeCharacter(character) {
  const rarity = character.rarity || 'N';
  return {
    cardUid: character.cardUid || buildCardUid(character.characterId, rarity, character.serial || 1),
    characterId: character.characterId,
    name: character.name,
    race: character.race,
    job: character.job,
    role: character.role,
    alignment: character.alignment || 'GOOD',
    rarity,
    serial: character.serial || 1,
    story: character.story || '',
    firstAppearance: character.firstAppearance || '',
    tags: character.tags || [],
    sourceType: character.sourceType || 'hero'
  };
}

function buildCardUid(characterId, rarityId, serial = 1) {
  return `CARD-${characterId}-${rarityId}-${String(serial).padStart(4, '0')}`;
}

function inferAlignment(auraId) {
  if (auraId === 'AURA-EVIL-DARKRED') return 'EVIL';
  if (auraId === 'AURA-AMBIGUOUS-PURPLE') return 'NEUTRAL';
  if (auraId === 'AURA-LEGEND-GOLD') return 'LEGEND';
  return 'GOOD';
}

function inferRarity(auraId) {
  if (auraId === 'AURA-LEGEND-GOLD') return 'L';
  if (auraId === 'AURA-AMBIGUOUS-PURPLE') return 'EP';
  if (auraId === 'AURA-EVIL-DARKRED') return 'SR';
  return 'R';
}

function fillControls() {
  selectEl.innerHTML = state.characters.map((character) => {
    return `<option value="${escapeHtml(character.characterId)}">${escapeHtml(character.characterId)} · ${escapeHtml(character.name)}</option>`;
  }).join('');

  rarityEl.innerHTML = (state.styles.rarityTiers || []).map((tier) => {
    return `<option value="${escapeHtml(tier.rarityId)}">${escapeHtml(tier.name)} (${escapeHtml(tier.shortLabel)})</option>`;
  }).join('');

  selectEl.value = state.selectedId;
  rarityEl.value = state.selectedRarity;
}

function bindEvents() {
  selectEl.addEventListener('change', () => {
    state.selectedId = selectEl.value;
    const character = getSelectedCharacter();
    state.selectedRarity = character.rarity;
    rarityEl.value = state.selectedRarity;
    render();
  });

  rarityEl.addEventListener('change', () => {
    state.selectedRarity = rarityEl.value;
    render();
  });
}

function getSelectedCharacter() {
  return state.characters.find((character) => character.characterId === state.selectedId) || state.characters[0];
}

function getRarity(rarityId) {
  return (state.styles.rarityTiers || []).find((tier) => tier.rarityId === rarityId) || state.styles.rarityTiers[0];
}

function getAura(alignmentId, rarityId) {
  if (rarityId === 'L') {
    return (state.styles.alignmentAuras || []).find((aura) => aura.alignmentId === 'LEGEND');
  }
  return (state.styles.alignmentAuras || []).find((aura) => aura.alignmentId === alignmentId) || state.styles.alignmentAuras[0];
}

function render() {
  const character = getSelectedCharacter();
  const rarity = getRarity(state.selectedRarity || character.rarity);
  const aura = getAura(character.alignment, rarity.rarityId);
  const stars = '★'.repeat(rarity.starCount) + '☆'.repeat(Math.max(0, 5 - rarity.starCount));
  const cardUid = character.rarity === rarity.rarityId
    ? character.cardUid
    : buildCardUid(character.characterId, rarity.rarityId, character.serial || 1);

  previewEl.innerHTML = `
    <article class="official-card" style="--rarity-border:${rarity.borderColor}; --rarity-accent:${rarity.accentColor}; --aura-color:${aura.auraColor}; --aura-intensity:${rarity.auraIntensity}">
      <div class="rarity-badge"><div><small>${escapeHtml(rarity.name)}</small><strong>${escapeHtml(rarity.shortLabel)}</strong></div></div>
      <div class="card-grid">
        <section>
          <div class="card-logo">헌혈의 집</div>
          <div class="card-uid">${escapeHtml(cardUid)}</div>
          <div class="card-id">CHARACTER ${escapeHtml(character.characterId)}</div>
          <div class="card-name">${escapeHtml(character.name)}</div>
          <div class="card-subtitle">${escapeHtml(character.race)} · ${escapeHtml(character.job)}</div>
          <div class="info-list">
            <div class="info-row"><span>종족</span><span>${escapeHtml(character.race)}</span></div>
            <div class="info-row"><span>성향</span><span>${escapeHtml(aura.name)}</span></div>
            <div class="info-row"><span>역할</span><span>${escapeHtml(character.role)}</span></div>
            <div class="info-row"><span>등장</span><span>${escapeHtml(character.firstAppearance)}</span></div>
            <div class="info-row"><span>등급</span><span>${escapeHtml(rarity.name)} · ${stars}</span></div>
          </div>
        </section>
        <section class="portrait-slot">
          <div>
            <strong>캐릭터 일러스트 슬롯</strong>
            <p>여기에 텍스트 없는 단일 캐릭터 이미지를 삽입합니다.</p>
          </div>
        </section>
      </div>
      <div class="panel-row">
        <div class="card-panel">
          <h3>아우라 · ${escapeHtml(aura.auraName)}</h3>
          <p>${escapeHtml(aura.meaning)}</p>
        </div>
        <div class="card-panel">
          <h3>소개</h3>
          <p>${escapeHtml(character.story)}</p>
        </div>
      </div>
      <div class="tag-row">
        ${character.tags.map((tag) => `<span class="card-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

boot().catch((error) => {
  previewEl.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
});
