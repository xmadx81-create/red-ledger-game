# OpenAI Images MCP 서버 (헌혈의 집 / 혈연센터)

Claude Code가 MCP 도구로 OpenAI 이미지 생성을 호출하고, 결과를 프로젝트 폴더에 저장하며, 생성 기록·메타데이터를 남깁니다.

## 제공 도구
| 도구 | 용도 |
|---|---|
| `generate_game_image` | 범용 텍스트→이미지 |
| `create_character_concept` | 캐릭터 컨셉(세로 카드 비율) |
| `create_item_icon` | 아이템 아이콘(정사각) |
| `create_location_background` | 장소/배경(가로) |
| `create_ui_asset` | 버튼/프레임 등 UI 에셋 |
| `edit_game_image` | 기존 이미지+프롬프트 편집 |

공통 입력: `prompt, category, filename_prefix, size, output_format, style_note, save_path, usage` (편집은 `image_path` 추가)

## 저장 & 기록
- 이미지: 기본 `assets/generated/{characters|items|locations|ui}/`, `save_path`로 재정의
  - 카드용 캐릭터는 `save_path=src/web-mvp/assets/portraits/{characterId}.png` → 카드 도감 자동 표시
- 기록: `assets/generated/asset_manifest.json` + `docs/preprocessing/WORK_LOG.md`
  - 프롬프트·생성일시·모델·파일명·용도·카테고리·size·포맷 기록

## 1) 설치
```bash
cd mcp/openai-image
npm install
```

## 2) 환경변수 (키를 코드/리포에 직접 쓰지 않음)
```bash
cp .env.example .env   # .env 는 .gitignore 됨
# .env 에 OPENAI_API_KEY 입력  (또는 셸에서)
export OPENAI_API_KEY=sk-...
export OPENAI_IMAGE_MODEL=gpt-image-1   # 선택
```

## 3) Claude Code 등록
**A. 리포 루트 `.mcp.json`** (이미 추가됨, 프로젝트 스코프)
```json
{ "mcpServers": { "openai-image": {
  "command": "node", "args": ["mcp/openai-image/server.mjs"],
  "env": { "OPENAI_API_KEY": "${OPENAI_API_KEY}", "OPENAI_IMAGE_MODEL": "gpt-image-1" } } } }
```
**B. 또는 CLI**
```bash
claude mcp add openai-image --env OPENAI_API_KEY=$OPENAI_API_KEY -- node mcp/openai-image/server.mjs
```
등록 후 Claude Code 재시작/세션 재연결하면 도구가 노출됩니다.

## ⚠️ 네트워크
원격(웹) 환경은 egress 정책 제한이 있을 수 있습니다. `api.openai.com` 호출이 허용돼야 동작합니다. 막히면 키가 있어도 호출이 실패합니다(로컬 실행 권장 또는 네트워크 정책 허용).

## 정책
- API 키는 env `OPENAI_API_KEY` 에서만 읽음. 코드/리포 미기재.
- 실제 기관명 미사용 — 가상명만: 백십자재단 · 혈연센터 · 카르테인 가문 혈액관리국.
- 톤: 밝고 명랑한 헌혈센터 표면 + 은근한 뱀파이어 행정 누아르 이면. (서버가 프롬프트에 자동 부가, 금지어 포함)
- 실패 시 OpenAI 오류 원인을 숨기지 않고 도구 응답·stderr·매니페스트에 로그.
