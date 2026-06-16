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

공통 입력: `prompt, category, filename_prefix, size, output_format, style_note, save_path, usage`  
편집 도구는 `image_path` 추가.

## 저장 & 기록

- 이미지 기본 저장 위치: `assets/generated/{characters|items|locations|ui}/`
- `save_path`를 지정하면 저장 위치를 직접 정할 수 있음
- 카드용 캐릭터 권장 경로: `src/web-mvp/assets/portraits/{characterId}.png`
- 생성 기록:
  - `assets/generated/asset_manifest.json`
  - `docs/preprocessing/WORK_LOG.md`
- 기록 항목:
  - 프롬프트
  - 생성 일시
  - 모델명
  - 파일명
  - 용도
  - 카테고리
  - size
  - 포맷

## 1) 설치

```bash
cd mcp/openai-image
npm install
```

## 2) 환경변수

API 키는 코드나 GitHub 저장소에 직접 쓰지 않습니다.

```bash
cp .env.example .env
```

그다음 `.env`에 본인 키를 입력합니다.

```env
OPENAI_API_KEY=sk-여기에-키
OPENAI_IMAGE_MODEL=gpt-image-2
```

또는 셸에서만 임시로 설정할 수 있습니다.

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_IMAGE_MODEL="gpt-image-2"
```

## 3) Claude Code 등록

리포 루트의 `.mcp.json`에 이미 프로젝트 스코프 MCP 서버가 추가되어 있습니다.

```json
{
  "mcpServers": {
    "openai-image": {
      "command": "node",
      "args": ["mcp/openai-image/server.mjs"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "OPENAI_IMAGE_MODEL": "${OPENAI_IMAGE_MODEL:-gpt-image-2}"
      }
    }
  }
}
```

Claude Code를 재시작한 뒤 `/mcp`에서 `openai-image` 서버를 승인/확인합니다.

CLI로 직접 등록하는 방식이 필요하면 아래처럼 실행할 수 있습니다.

```bash
claude mcp add --transport stdio openai-image -- node mcp/openai-image/server.mjs
```

## 4) 휴대폰에서 보고 있는 경우

휴대폰에서는 실제 `npm install`, 환경변수 입력, Claude Code 재시작을 대신 실행할 수 없습니다.  
PC에서 저장소를 열고 아래 4줄만 실행하면 됩니다.

```bash
git pull
cd mcp/openai-image
npm install
export OPENAI_API_KEY="sk-..."
```

그다음 Claude Code를 재시작하고 `/mcp`에서 `openai-image`를 승인합니다.

## 네트워크 주의

원격/웹 환경은 egress 정책 때문에 `api.openai.com` 호출이 막힐 수 있습니다. 키가 맞아도 네트워크가 막히면 실패합니다. 이 경우 로컬 PC 실행을 권장합니다.

## 정책

- API 키는 env `OPENAI_API_KEY`에서만 읽음
- 코드/리포에 키 저장 금지
- `.env`는 `.gitignore`에 포함됨
- 실제 기관명 미사용
- 가상명만 사용: 백십자재단 · 혈연센터 · 카르테인 가문 혈액관리국
- 톤: 밝고 명랑한 헌혈센터 표면 + 은근한 뱀파이어 행정 누아르 이면
- 실패 시 OpenAI 오류 원인을 숨기지 않고 도구 응답·stderr·매니페스트에 기록
