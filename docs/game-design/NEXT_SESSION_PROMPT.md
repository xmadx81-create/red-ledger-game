# 새 세션에서 「헌혈의 집」 계속 개발하기 — 핸드오프 프롬프트

아래 블록을 **새 세션(첫 메시지)** 에 그대로 붙여넣으면 이어서 개발/이미지 생성이 됩니다.

> ⚠️ 이미지 생성을 하려면 그 세션의 **네트워크 정책이 `api.openai.com` egress 허용**이어야 하고, **`OPENAI_API_KEY`** 가 설정돼 있어야 합니다. (현재 세션은 egress 403 차단이라 생성 불가)

---

```text
red-ledger-game(「헌혈의 집」) 개발을 이어서 한다. 기본 브랜치 main, 작업 브랜치 claude/session-capabilities-2iwgn3.

[프로젝트]
- 운영 시뮬 → 수집형 카드 배틀 RPG로 전환 완료.
- 마스터 기획: docs/game-design/CARD_GAME_DESIGN_001.md
- 전체 현황: docs/game-design/MVP_BUILD_STATUS_2026-06-16.md
- 플레이: `npm run play` → http://localhost:5173/hub.html (허브 → 월드맵/합성소/히든합성/배치육성소/전투(5장르)/카드도감/컬렉션)
- 검증: `npm test`(데이터 정합성+JS 구문), `npm run sim`(경제 곡선), `npm run prompts`(일러스트 프롬프트 시트 재생성)

[이미지 생성]
- MCP 서버: mcp/openai-image (도구: generate_game_image, create_character_concept, create_item_icon, create_location_background, create_ui_asset, edit_game_image). 키는 env OPENAI_API_KEY.
- 카드 일러스트 규칙: 생성 이미지를 save_path=src/web-mvp/assets/portraits/{characterId}.png 로 저장하면 카드 도감(gallery.html) 앞면에 자동 표시.
- 프롬프트 시트: docs/game-design/PORTRAIT_PROMPTS_001.md (characterId·파일명·프롬프트).
- 서버가 톤/금지어/가상명을 자동 부가하고, assets/generated/asset_manifest.json + docs/preprocessing/WORK_LOG.md 에 기록함.

[지금 할 일]
1) create_character_concept 로 PORTRAIT_PROMPTS_001.md 의 캐릭터를 Batch(약 10명) 단위로 생성.
   - 각 호출: prompt=시트 프롬프트(또는 캐릭터 묘사), filename_prefix={characterId}, save_path=src/web-mvp/assets/portraits/{characterId}.png, usage="카드 일러스트".
   - size 미지정(캐릭터 기본 1024x1536).
2) 톤 고정: 밝고 명랑한 헌혈센터 표면 + 은근한 뱀파이어 행정 누아르 이면. 가상명만 사용(백십자재단/혈연센터/카르테인 가문 혈액관리국). 폐허/전쟁/고어/검은 고딕/적십자류 금지.
3) Batch마다: 결과 확인 → 톤 위반분 재생성 → 커밋 → PR → main 머지.
   - ※ squash 머지 후에는 반드시 `git fetch origin main && git reset --hard origin/main` 로 작업 브랜치를 재정렬(안 그러면 머지 충돌). 또는 rebase 머지 사용.
4) `npm test` 통과 확인. 카드 도감(gallery.html)에서 일러스트 표시 확인.
5) 이미지 외 다음 후보: 허브/전투 화면 버튼 디자인 통일, 아이템 아이콘(create_item_icon), 장소 배경(create_location_background), 대륙/섬 콘텐츠.

[규칙]
- 데이터/체크리스트/대시보드는 이미지화하지 않는다. 이미지는 캐릭터/아이템/배경/아이콘 단위로만.
- 실제 기관/적십자 상표 미사용.
- 커밋은 작업 단위로, push는 작업 브랜치에, 머지는 CI(빌드+smoke) 그린 확인 후.
```

---

## 새 세션 여는 법 (요약)
- **웹**: 새 환경 생성 시 네트워크 정책 = 외부 허용, 환경변수에 `OPENAI_API_KEY` 주입 → 위 프롬프트 붙여넣기.
- **로컬 Claude Code**: 리포 clone → `cd mcp/openai-image && npm install` → `export OPENAI_API_KEY=sk-...` → Claude Code 실행(`.mcp.json` 자동 인식) → 위 프롬프트 붙여넣기.
