// 카드 일러스트 생성용 프롬프트 시트 생성기.
// 로스터 + 톤 규칙에서 캐릭터별 이미지 프롬프트를 만들어, 어떤 이미지 도구에 넣어도
// {characterId}.png 로 뽑아 src/web-mvp/assets/portraits/ 에 드롭하면 카드에 자동 적용된다.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '../src/web-mvp/data');
const J = async (f) => JSON.parse(await readFile(path.join(DATA, f), 'utf8'));

const TONE = 'bright cheerful blood-donation-center world, warm friendly community tone, clean soft lighting, single character, vertical card portrait (3:4), simple bright interior or soft gradient background, wholesome, approachable';
const NEG = 'no text, no letters, no logos, no real organization/Red-Cross marks; avoid ruins, war, gore, blood splatter, black gothic castle, demonic, dark magic circle, horror-poster mood, cruel laboratory, morgue tone';

const AURA_MOOD = {
  'AURA-GOOD-BLUE': 'calm protective blue aura, trustworthy',
  'AURA-AMBIGUOUS-PURPLE': 'soft purple aura, mysterious but not scary',
  'AURA-EVIL-DARKRED': 'restrained crimson accent (kept bright, not pitch-dark), antagonist but readable',
  'AURA-LEGEND-GOLD': 'radiant golden aura, iconic legendary presence'
};
const RACE_HINT = {
  '인간': 'human, grounded gear', '뱀프': 'vampire, elegant but not gothic-cliché',
  '늑대인간': 'werewolf, athletic, fur accents', '드워프': 'dwarf, sturdy, engineering gear',
  '엘프': 'elf/fae, nature & rune motifs, white/green/blue', '정령': 'elemental spirit, glowing',
  '호빗': 'hobbit, small & cheerful', '골렘': 'golem, stone/metal/crystal, large silhouette',
  '하이브리드': 'hybrid, dual-trait subtle', '초고대뱀프': 'ancient vampire, regal radiant',
  '초고대늑대인간': 'ancient werewolf, primal noble'
};

function prompt(c) {
  const aura = AURA_MOOD[c.aura] || '';
  const race = RACE_HINT[c.race] || c.race;
  return `${c.name} — ${race}, ${c.genderAge || ''}, ${c.job}, role: ${c.role}. ${aura}. ${TONE}. ${NEG}.`
    .replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
}

const hero = await J('hero-roster-by-race.json');
const enemy = await J('enemy-hero-roster.json');
const rows = [];
for (const r of hero.races) for (const h of r.heroes) {
  rows.push({ id: h.id, file: `${h.id}.png`, name: h.name, prompt: prompt({ ...h, race: r.raceName }) });
}
for (const e of enemy.enemyHeroes) {
  rows.push({ id: e.id, file: `${e.id}.png`, name: e.name, prompt: prompt(e) });
}

// JSON 데이터
await writeFile(path.join(DATA, 'portrait-prompts.json'), JSON.stringify({
  version: '0.1.0',
  description: '카드 일러스트 생성용 프롬프트 시트(자동 생성). gen-portrait-prompts.mjs로 재생성. 출력 파일명 {characterId}.png를 src/web-mvp/assets/portraits/에 드롭하면 카드 도감에 자동 적용.',
  tone: TONE, negative: NEG, count: rows.length, prompts: rows
}, null, 2) + '\n', 'utf8');

// 사람이 읽는 MD 시트
const md = ['# 카드 일러스트 프롬프트 시트 (자동 생성)', '',
  '> `npm run prompts`로 재생성. 각 프롬프트로 이미지를 만들고 `{파일명}`으로 `src/web-mvp/assets/portraits/`에 저장하면 카드에 자동 표시됩니다.',
  `> 톤 고정: ${TONE}`, `> 금지: ${NEG}`, '', `총 ${rows.length}장`, '',
  '| 파일명 | 캐릭터 | 프롬프트 |', '|---|---|---|',
  ...rows.map((r) => `| \`${r.file}\` | ${r.name} | ${r.prompt} |`)].join('\n') + '\n';
await writeFile(path.resolve(__dirname, '../docs/game-design/PORTRAIT_PROMPTS_001.md'), md, 'utf8');

console.log(`프롬프트 시트 생성 완료: ${rows.length}장`);
console.log('→ src/web-mvp/data/portrait-prompts.json');
console.log('→ docs/game-design/PORTRAIT_PROMPTS_001.md');
console.log('\n예시:', rows[0].file, '\n', rows[0].prompt);
