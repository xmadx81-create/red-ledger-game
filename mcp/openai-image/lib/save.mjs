// base64 이미지 저장 + 출력 경로 해석. 기본은 assets/generated/{category}/, save_path로 재정의 가능.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '../../..'); // mcp/openai-image/lib → repo root

const CATEGORY_DIR = {
  character: 'characters', item: 'items',
  building: 'locations', background: 'locations', ui: 'ui'
};

export function resolveOutPath({ category, filename_prefix, output_format, save_path }) {
  if (save_path) {
    return path.isAbsolute(save_path) ? save_path : path.join(REPO_ROOT, save_path);
  }
  const sub = CATEGORY_DIR[category] || 'misc';
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = output_format || 'png';
  const base = (filename_prefix || category || 'img').replace(/[^\w가-힣-]+/g, '_');
  return path.join(REPO_ROOT, 'assets', 'generated', sub, `${base}_${ts}.${ext}`);
}

export async function saveBase64(b64, outPath) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(b64, 'base64'));
  return { absPath: outPath, relPath: path.relative(REPO_ROOT, outPath) };
}
