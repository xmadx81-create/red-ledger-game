// OpenAI Images API 호출 래퍼. API 키는 env OPENAI_API_KEY 에서만 읽는다(코드에 미기재).
import { readFile } from 'node:fs/promises';

const API = 'https://api.openai.com/v1';

function apiKey() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error('OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다. (.env 또는 셸 export 필요)');
  return k;
}
export function model() {
  return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
}

function pickB64(json) {
  const b64 = json && json.data && json.data[0] && json.data[0].b64_json;
  if (!b64) throw new Error('이미지(b64_json) 응답이 비어 있습니다: ' + JSON.stringify(json).slice(0, 400));
  return b64;
}

// 텍스트→이미지 생성
export async function generate({ prompt, size, output_format }) {
  const body = { model: model(), prompt, size: size || 'auto', n: 1 };
  if (output_format) body.output_format = output_format; // gpt-image-1: png|jpeg|webp
  const res = await fetch(`${API}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status} ${res.statusText}: ${JSON.stringify(json.error || json).slice(0, 500)}`);
  return pickB64(json);
}

// 기존 이미지 + 프롬프트로 편집
export async function edit({ imagePath, prompt, size, output_format }) {
  const buf = await readFile(imagePath);
  const fd = new FormData();
  fd.append('model', model());
  fd.append('prompt', prompt);
  if (size) fd.append('size', size);
  if (output_format) fd.append('output_format', output_format);
  fd.append('image', new Blob([buf]), imagePath.split('/').pop() || 'image.png');
  const res = await fetch(`${API}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: fd
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status} ${res.statusText}: ${JSON.stringify(json.error || json).slice(0, 500)}`);
  return pickB64(json);
}
