# 헌혈의 집 — 카드게임 MVP 빌드 현황 (2026-06-16)

문서 성격: 이번 작업 분기의 시스템·데이터·플레이 프로토타입 전체 스냅샷 + 다음 할 일.
상위 기획: `CARD_GAME_DESIGN_001.md` (마스터)

> 한 줄: 밝은 헌혈센터를 거점으로 혈맹 카드를 모아 **합성·육성·전투**로 끝없이 강해지는, 엔딩 없는 실시간 온라인 수집형 카드 RPG.

---

## 1. 핵심 플레이 루프 (전부 플레이 가능)

```text
🗺 월드맵(섬 개방)
   → ⚔ 스테이지 전투(5장르: 섬멸/설득/잠입/방어/수송, 승리)
      → 🎁 카드 보상 적립(인벤토리) + 스테이지 클리어(섬 개방) + 🗂 컬렉션 기록
         → ⚗ 합성소(N 모아 상위 등급 도약, 천장)
            → 🧪 배치 육성소(스탯 키워 자유 직업 부여 → 파티)
               → 다시 전투 …  (종료 없음)
```

상태(보유 카드·파티·진행도·컬렉션)는 `localStorage`로 화면 간 공유된다.

---

## 2. 플레이 가능한 화면 (src/web-mvp)

| 화면 | 파일 | 역할 |
|---|---|---|
| 🏠 허브 | `hub.html` | 게임 홈. 보유/파티 현황·온보딩 힌트·흐름 안내 |
| 🗺 월드맵 | `world-map.html` | 대륙>섬>거점, 섬 점진 개방, 거점→화면 이동 |
| ⚗ 합성소 | `fusion-lab.html` | 합성 가챠(확률+천장), 등급 도약, N 받기 |
| 🧪 배치 육성소 | `job-lab.html` | 장소 배치→스탯 재분배→직업 후보→파티 편성(공유 인벤토리 소비) |
| ⚔ 전투 | `battle-prototype.html` | 턴제 카드 전투 5장르(섬멸/설득/잠입/방어/수송), 스킬·시너지·오토, 보상·스테이지 클리어 |
| 🗂 컬렉션 | `collection.html` | 합성·잭팟으로 얻은 상위(R+) 카드 도감, 등급 요약/필터 |
| 🎴 카드 스튜디오 | `card-studio.html` | 후보E 카드 렌더·cardUid 검증 |
| 📖 캐릭터 도감 | `characters.html` | 캐릭터 목록(기존) |
| 🏛 (구) 운영 시뮬 | `index.html` | 옛 시뮬 앱(레거시, 유지) |

---

## 3. 시스템 & 기획 문서

| 시스템 | 문서 |
|---|---|
| 마스터 기획(장르 전환) | `CARD_GAME_DESIGN_001.md` |
| 지속 성장 루프 | `CORE_LOOP_REDESIGN_001.md` |
| 종족·하이브리드·합성 가챠·등급 | `RACE_HYBRID_FUSION_SYSTEM_001.md` |
| 전설 우선 하향식 합성 | `LEGENDARY_TOPDOWN_FUSION_STRUCTURE_001.md` |
| 히든 합성 트리(비공개 루트) | `HIDDEN_FUSION_TREE_001.md` |
| 유동 스탯(고정총량 재분배) | `CARD_STAT_SYSTEM_001.md` |
| 맵 배치→자유 직업 | `MAP_PLACEMENT_JOB_SYSTEM_001.md` |
| 월드맵 지리 계층 | `WORLD_MAP_STRUCTURE_001.md` |
| 일반카드 획득 경제 | `CARD_ACQUISITION_ECONOMY_001.md` |
| 전투 규칙 방향 | `BATTLE_RULES_DIRECTION_001.md` |
| 카드 제작/cardUid 규칙 | `CARD_PRODUCTION_PIPELINE_001.md` |
| 밝은 톤 가이드 | `VISUAL_TONE_GUIDE_001.md` |

---

## 4. 핵심 데이터 (src/web-mvp/data, 38개)

| 데이터 | 역할 |
|---|---|
| `card-style-system.json` | 등급(N/R/SR/EP/L)·아우라·카드 렌더 |
| `card-stat-schema.json` | 1차 8스탯·파생·budget·활동 재분배·잠금 |
| `placement-locations.json` | 맵 장소(작업→스탯) |
| `job-stat-profiles.json` | 스탯→직업 후보 판정 |
| `fusion-recipe-tree.json` | 등급 도약 확률+천장(공개 루트) |
| `hidden-fusion-recipes.json` | 비공개 히든 합성 체인(스켈레톤) |
| `legendary-anchor-set.json` | 최초 전설 5장(데이터, 이미지 제외) |
| `card-acquisition.json` | 출석/사냥/퀘스트 카드 획득 |
| `world-map.json` | 대륙>섬>거점 스켈레톤 |
| `battle-prototype.json` | 전투 셋업(파티/적/행동/스킬/시너지 + objectiveModes 4종: 설득/잠입/방어/수송) |
| `hero-roster-by-race.json` / `enemy-hero-roster.json` | 영웅/적 로스터 |
| `character-card-registry.json` | 카드 제작 진행 추적 |
| (그 외) | combat-actions, dungeon-types, stages, mbti-synergy, nurse-npcs 등 |

---

## 5. 공유 상태 키 (localStorage)

```text
hbh.inventory.v1   보유 카드(등급별 카운트)+합성 천장/통계 — 합성소·육성소·전투(보상)·허브·컬렉션 공유
hbh.party.v1       전투 파티(육성소에서 편성)             — 육성소→전투
hbh.cleared.v1     클리어한 스테이지 집합                  — 전투→월드맵 개방
hbh.collection.v1  획득한 상위(R+) 카드 도감 목록           — 합성소·전투→컬렉션
```

---

## 6. 정리 완료된 정합성/결정

```text
- 등급 사다리 N/R/SR/EP/L 5단계 통일(세분화는 ★ 단계). 장비 등급(item-grades 8단계)은 별개.
- cardUid 형식/중복/성향·아우라 정합 검증, Batch001 정합성 보정.
- 컨트롤 방식: 하이브리드(오토+수동) 채택·구현.
- 멀티 장르 5종 구현 + 직업 비대칭 검증(섬멸 균형 / 설득 CHA / 잠입 INT·속도 / 방어 VIT / 수송 회피·LUK).
- 맵↔전투 연동(승리→스테이지 클리어→섬 개방), 전투 보상→인벤토리 적립(순환 완성).
- 합성↔육성 공유 인벤토리, 컬렉션 도감.
- npm test 회귀 스모크(데이터 파싱·정합성·JS 구문) 통과.
```

---

## 7. 다음 할 일 (열린 항목)

```text
1. 카드 인스턴스 완전 식별 도입 → 히든 합성 트리 실제 구현(현재 fungible 카운트라 미지원)
2. 전설 5장/히든 체인의 '카드 확정'(현재 placeholder)
3. v0 수치 밸런스(합성 확률·budget·일일 N 공급·시즌 길이 연동)
4. 대륙/섬 실제 콘텐츠·맵 이동 연출
5. 온라인/소셜(길드·랭킹·PvP) 범위 결정
6. 컬렉션→육성/전투로 특정 카드 데려가기(인스턴스 식별 후)
7. (마지막) 캐릭터/카드/맵 이미지 — Batch 단위·톤 가이드 준수

[완료됨] 멀티 장르 5종(잠입/방어/수송 추가), 컬렉션 도감, 맵↔전투 연동, 전투 보상 루프, npm test
```

---

## 8. 실행

```bash
npm install && npm run dev
# 브라우저에서 src/web-mvp/hub.html 진입 → 월드맵/합성소/육성소/전투/컬렉션으로 이동
npm test     # 데이터 정합성 + 프로토타입 JS 구문 회귀 검사
```

> 원칙 유지: 문서·데이터·밸런스·톤 먼저, 이미지는 마지막. 데이터/체크리스트는 이미지화하지 않는다.
