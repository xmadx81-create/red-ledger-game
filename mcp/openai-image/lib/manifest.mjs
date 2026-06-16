// 생성 기록: assets/generated/asset_manifest.json + docs/preprocessing/WORK_LOG.md
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT } from './save.mjs';

const MANIFEST = path.join(REPO_ROOT, 'assets', 'generated', 'asset_manifest.json');
const WORK_LOG = path.join(REPO_ROOT, 'docs', 'preprocessing', 'WORK_LOG.md');

export async function record(entry) {
  await mkdir(path.dirname(MANIFEST), { recursive: true });
  let m = { project: '헌혈의 집 / 혈연센터', version: '0.1', note: 'OpenAI Images MCP 생성 기록', records: [] };
  try {
    const cur = JSON.parse(await readFile(MANIFEST, 'utf8'));
    if (cur && Array.isArray(cur.records)) m = cur;
  } catch { /* 신규 생성 */ }
  m.records.push(entry);
  m.updatedAt = new Date().toISOString();
  await writeFile(MANIFEST, JSON.stringify(m, null, 2) + '\n');

  const line = `- ${entry.generatedAt} · ${entry.tool} · [${entry.category}] ${entry.filename} · 용도:${entry.usage || '-'} · 모델:${entry.model} · size:${entry.size} · prompt:"${String(entry.prompt || '').replace(/\s+/g, ' ').slice(0, 180)}"`;
  try {
    await appendFile(WORK_LOG, `\n${line}`);
  } catch (e) {
    // WORK_LOG 기록 실패는 치명적이지 않음 — 매니페스트에 표시
    entry._workLogError = String(e.message || e);
  }
  return { manifest: path.relative(REPO_ROOT, MANIFEST), workLog: path.relative(REPO_ROOT, WORK_LOG) };
}
