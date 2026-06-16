#!/usr/bin/env node
// 헌혈의 집(혈연센터) OpenAI Images MCP 서버 (stdio).
// 도구: generate_game_image / create_character_concept / create_item_icon /
//       create_location_background / create_ui_asset / edit_game_image
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as oai from './lib/openai-images.mjs';
import { resolveOutPath, saveBase64 } from './lib/save.mjs';
import { record } from './lib/manifest.mjs';
import { buildPrompt, defaultSize } from './lib/tone.mjs';

const COMMON_PROPS = {
  prompt: { type: 'string', description: '생성할 이미지 내용(자연어). 핵심 묘사만 — 톤/금지어는 서버가 자동 부가.' },
  category: { type: 'string', enum: ['character', 'item', 'building', 'background', 'ui'], description: '에셋 분류' },
  filename_prefix: { type: 'string', description: '저장 파일명 접두어(예: HUM-001, potion-heal). save_path 없을 때 사용' },
  size: { type: 'string', description: '이미지 크기(예: 1024x1024, 1024x1536, 1536x1024, auto). 미지정 시 카테고리 기본값' },
  output_format: { type: 'string', enum: ['png', 'jpeg', 'webp'], description: '출력 포맷(기본 png)' },
  style_note: { type: 'string', description: '추가 스타일 지시(선택)' },
  save_path: { type: 'string', description: '저장 경로(리포 루트 상대 또는 절대). 카드용은 src/web-mvp/assets/portraits/{characterId}.png 권장' },
  usage: { type: 'string', description: '용도 메모(매니페스트 기록용)' }
};

const TOOLS = [
  { name: 'generate_game_image', description: '범용 게임 이미지 생성(텍스트→이미지).', category: null,
    schema: { type: 'object', properties: COMMON_PROPS, required: ['prompt'] } },
  { name: 'create_character_concept', description: '캐릭터 컨셉 아트(세로 카드 비율 프리셋). 카드 도감용.', category: 'character',
    schema: { type: 'object', properties: COMMON_PROPS, required: ['prompt'] } },
  { name: 'create_item_icon', description: '아이템 아이콘(정사각 아이콘 프리셋).', category: 'item',
    schema: { type: 'object', properties: COMMON_PROPS, required: ['prompt'] } },
  { name: 'create_location_background', description: '장소/배경 아트(가로 프리셋).', category: 'background',
    schema: { type: 'object', properties: COMMON_PROPS, required: ['prompt'] } },
  { name: 'create_ui_asset', description: 'UI 에셋(버튼/프레임/아이콘) 생성.', category: 'ui',
    schema: { type: 'object', properties: COMMON_PROPS, required: ['prompt'] } },
  { name: 'edit_game_image', description: '기존 이미지 + 프롬프트로 편집(images/edits).', category: null, edit: true,
    schema: { type: 'object', properties: { ...COMMON_PROPS, image_path: { type: 'string', description: '편집할 원본 이미지 경로(리포 상대/절대)' } }, required: ['prompt', 'image_path'] } }
];
const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

function ok(obj) { return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] }; }
function fail(stage, err) {
  // 실패를 숨기지 않고 원인을 그대로 노출
  const msg = `[${stage}] 실패: ${err && err.message ? err.message : String(err)}`;
  console.error(msg);
  return { isError: true, content: [{ type: 'text', text: msg }] };
}

async function handle(toolDef, args) {
  const category = toolDef.category || args.category || 'character';
  const size = args.size || defaultSize(category);
  const output_format = args.output_format || 'png';
  const finalPrompt = buildPrompt({ prompt: args.prompt, category, style_note: args.style_note });

  let b64;
  try {
    b64 = toolDef.edit
      ? await oai.edit({ imagePath: resolveOutPath({ save_path: args.image_path, category, output_format }), prompt: finalPrompt, size, output_format })
      : await oai.generate({ prompt: finalPrompt, size, output_format });
  } catch (e) { return fail('OpenAI 호출', e); }

  let saved;
  try {
    const outPath = resolveOutPath({ category, filename_prefix: args.filename_prefix, output_format, save_path: args.save_path });
    saved = await saveBase64(b64, outPath);
  } catch (e) { return fail('파일 저장', e); }

  const entry = {
    filename: saved.relPath.split('/').pop(), path: saved.relPath, prompt: finalPrompt,
    model: oai.model(), generatedAt: new Date().toISOString(), category,
    usage: args.usage || '', size, format: output_format, tool: toolDef.name
  };
  let logs;
  try { logs = await record(entry); } catch (e) { return fail('매니페스트 기록', e); }

  return ok({ saved: saved.relPath, metadata: entry, recordedIn: logs, hint: '카드용이면 save_path=src/web-mvp/assets/portraits/{characterId}.png 로 저장하면 도감에 자동 표시됩니다.' });
}

const server = new Server({ name: 'openai-image', version: '0.1.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.schema }))
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const def = TOOL_MAP.get(req.params.name);
  if (!def) return fail('도구 조회', new Error(`알 수 없는 도구: ${req.params.name}`));
  try { return await handle(def, req.params.arguments || {}); }
  catch (e) { return fail('처리', e); }
});

await server.connect(new StdioServerTransport());
console.error('openai-image MCP 서버 시작됨 (stdio). 모델:', oai.model());
