// 톤/프롬프트 프리셋 + 가상명 가드. 실제 기관명 미사용.
export const FICTIONAL = ['백십자재단', '혈연센터', '카르테인 가문 혈액관리국'];

// 밝고 명랑한 헌혈센터 표면 + 은근한 뱀파이어 행정 누아르 이면
export const BASE_TONE =
  'bright, cheerful blood-donation-center surface mood with a subtle hidden vampire-administration noir undertone; ' +
  'warm friendly community feel on the surface, faint mystery beneath; clean soft lighting, wholesome and approachable';

export const NEGATIVE =
  'no text, no letters, no logos, no real-world organization marks, no Red-Cross-style emblem; ' +
  'avoid gore, blood splatter, ruined city, war battlefield, pitch-black gothic-horror, cruel laboratory, morgue tone';

const CATEGORY_PRESET = {
  character: 'single character, vertical card portrait (3:4), clear friendly silhouette, centered',
  item: 'single game item icon, centered on simple soft background, crisp and readable',
  building: 'establishing location / background art, wide cinematic composition',
  background: 'establishing location / background art, wide cinematic composition',
  ui: 'clean UI asset (button / frame / icon), flat, app-friendly, soft shadows'
};

export function buildPrompt({ prompt, category, style_note }) {
  return [
    prompt,
    style_note,
    CATEGORY_PRESET[category] || '',
    BASE_TONE,
    `If any signage/world naming is implied, use only fictional names (${FICTIONAL.join(', ')}) — but render NO actual readable text.`,
    NEGATIVE
  ].filter(Boolean).join('. ').replace(/\s+/g, ' ').trim();
}

export function defaultSize(category) {
  if (category === 'character') return '1024x1536';
  if (category === 'building' || category === 'background') return '1536x1024';
  return '1024x1024';
}
