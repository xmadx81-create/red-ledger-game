# MVP 구현 계획

이 문서는 `red-ledger-game`의 1차 MVP를 실제 개발로 옮기기 위한 구현 순서와 기준을 정의합니다.

## 목적

기획 문서, Google Sheets 데이터, Figma 화면 설계를 실제 게임 MVP로 연결하기 위한 개발 기준 문서입니다.

## 현재 준비된 기준 자료

| 구분 | 기준 자료 |
|---|---|
| 게임 개요 | `docs/game-design/GAME_OVERVIEW.md` |
| 7일 구조 | `docs/game-design/MVP_7DAYS_PLAN.md` |
| 자원 시스템 | `docs/system-design/CORE_RESOURCE_SYSTEM.md` |
| 캐릭터 | `docs/game-design/CHARACTER_BRIEF.md` |
| 이벤트/선택지 | `docs/game-design/EVENT_STRUCTURE.md` |
| UI 흐름 | `docs/ui-ux/FIRST_SCREEN_FLOW.md` |
| UI 컴포넌트 | `docs/ui-ux/UI_COMPONENT_SPEC.md` |
| 화면-데이터 연결 | `docs/ui-ux/SCREEN_DATA_EVENT_MAP.md` |
| Google Sheets | `docs/data-design/GOOGLE_SHEETS_ACTUAL_LINK.md` |
| Figma | `docs/ui-ux/FIGMA_ACTUAL_LINK.md` |

## MVP 개발 목표

1차 MVP는 상용 완성본이 아니라 핵심 재미 검증용입니다.

검증 목표는 다음과 같습니다.

```text
7일 운영이 가능한가
수요/공급 균형이 재미를 만드는가
중용 판단이 선택지의 핵심이 되는가
암거래 단서가 압박 요소로 작동하는가
캐릭터 반응이 선택 결과에 의미를 주는가
최종 평가 화면이 다음 회차 욕구를 만드는가
```

## 구현 우선순위

| 순위 | 구현 대상 | 이유 |
|---:|---|---|
| 1 | 정적 데이터 로딩 | 자원, 이벤트, 선택지, 캐릭터 데이터가 먼저 필요 |
| 2 | Day 진행 상태 | Day 1~Day 7 흐름의 뼈대 |
| 3 | 자원 상태 관리 | 수요/공급과 중용 시스템의 핵심 |
| 4 | 이벤트 표시 | 플레이어가 판단할 사건 카드 |
| 5 | 선택지 처리 | 자원 변화와 플래그 누적 |
| 6 | 결과 화면 | 선택 결과 피드백 |
| 7 | 메인 운영 화면 | 하루 운영의 중심 화면 |
| 8 | 최종 평가 화면 | 7일 결과와 엔딩 분기 |
| 9 | 저장/불러오기 | MVP 후반 추가 |
| 10 | 연출/사운드/고급 UI | 핵심 루프 검증 이후 |

## 1차 구현 범위

### 포함

- 타이틀 화면
- 프롤로그 문서 화면
- 부임 통지 화면
- 봉인 보고서 화면
- Day 1 시작 보고
- 핵심 자원 튜토리얼
- 첫 선택지 화면
- 선택 결과 화면
- 메인 운영 화면
- Day 1~Day 7 이벤트 진행
- Day별 선택지 처리
- 자원 변화 계산
- 엔딩 플래그 누적
- 최종 평가 화면

### 제외

- 계정/로그인
- 온라인 멀티플레이
- 실시간 전투
- 복잡한 캐릭터 수집 시스템
- 고급 애니메이션
- 상점/결제
- 대규모 지역 확장
- 모든 종족의 직접 등장

## 데이터 구조 기준

MVP 구현은 Google Sheets 데이터를 기준으로 하되, 실제 게임에서는 JSON 또는 내부 데이터 객체로 변환해 사용합니다.

### 주요 데이터 객체

```text
Resource
Character
Event
Choice
GameState
EndingFlag
Screen
```

## Resource 구조

```text
resource_id
resource_name
category
current_value
min_value
max_value
safe_min
safe_max
status
```

## Character 구조

```text
character_id
name
role
species
relationship_state
stats
skills
story_summary
mvp_enabled
```

## Event 구조

```text
event_id
event_name
event_type
day
trigger_condition
summary
scene_text
related_characters
choice_group_id
risk_level
```

## Choice 구조

```text
choice_id
event_id
choice_text
choice_tone
result_summary
resource_changes
character_reactions
relationship_changes
ending_flag
```

## GameState 구조

```text
current_day
current_event_id
resources
characters
selected_choices
ending_flags
supply_failure_count
black_market_risk
internal_collapse_risk
media_exposure_risk
```

## 화면 구현 순서

| 단계 | 화면ID | 화면명 | 구현 기준 |
|---:|---|---|---|
| 1 | SCR-001 | 타이틀 화면 | 새 게임 진입 가능 |
| 2 | SCR-002 | 프롤로그 문서 | 문서형 텍스트 표시 |
| 3 | SCR-003 | 부임 통지 | 플레이어 역할 안내 |
| 4 | SCR-004 | 봉인 보고서 | 이면 구조 첫 공개 |
| 5 | SCR-005 | Day 1 시작 보고 | Day 상태 표시 |
| 6 | SCR-006 | 핵심 자원 튜토리얼 | ResourceBar 표시 |
| 7 | SCR-007 | 첫 선택지 | ChoiceCard 3개 표시 |
| 8 | SCR-008 | 선택 결과 | ResultChangeCard 표시 |
| 9 | SCR-009 | 메인 운영 화면 | Day별 사건/자원/인물 반응 표시 |
| 10 | SCR-010 | 최종 평가 화면 | 엔딩 플래그와 최종 자원 표시 |

## 기본 플레이 루프 구현

```text
새 게임 시작
→ 초기 GameState 생성
→ Day 1 시작
→ 해당 Day 이벤트 로드
→ 이벤트 설명 표시
→ 선택지 표시
→ 선택지 선택
→ 자원 변화 적용
→ 인물 반응 적용
→ 엔딩 플래그 누적
→ 결과 화면 표시
→ Day 종료 판정
→ 다음 Day 이동
→ Day 7 종료 후 최종 평가
```

## 자원 변화 처리 순서

```text
1. 선택지의 resource_changes 읽기
2. 현재 자원값에 변화량 적용
3. 0 미만이면 0으로 보정
4. 100 초과이면 100으로 보정
5. 안전 구간 이탈 여부 판정
6. 위험 상태 메시지 생성
7. 결과 화면에 요약 표시
```

## 수요/공급 판정

MVP 기본 판정식은 다음을 사용합니다.

```text
공급 차이 = 혈액 재고 - 혈액 수요
```

| 공급 차이 | 판정 | 처리 |
|---:|---|---|
| -30 이하 | 심각한 부족 | 공급 실패 카운트 증가, 폭주 위험 메시지 |
| -29~-10 | 부족 | 가문 만족도 하락, 경고 메시지 |
| -9~20 | 적정 | 안정 메시지 |
| 21~40 | 과잉 | 보안 부담 메시지 |
| 41 이상 | 위험한 과잉 | 언론 노출 또는 기록 위험 메시지 |

## 엔딩 플래그

| 플래그 | 의미 |
|---|---|
| SUPPLY_STABLE | 수요/공급 안정 |
| SUPPLY_COLLAPSE | 공급 붕괴 위험 |
| EXPOSED_MEDIA | 언론 노출 위험 |
| FAMILY_DOMINANT | 가문 우선 운영 |
| HUMAN_TRUST | 인간 사회 우선 운영 |
| BLACK_MARKET_DOMINANT | 암거래망 영향 확대 |
| INTERNAL_COLLAPSE | 내부 불안 누적 |

## 최종 평가 기준

Day 7 종료 시 다음 기준으로 평가합니다.

```text
1. 0 또는 100에 도달한 위험 자원이 있는가
2. 공급 실패가 누적되었는가
3. 언론 노출이 위험 구간인가
4. 조직 불안이 위험 구간인가
5. 암거래 단서가 통제 가능한가
6. 어떤 엔딩 플래그가 가장 많이 누적되었는가
```

## 최소 테스트 시나리오

| 테스트ID | 테스트명 | 목적 |
|---|---|---|
| TEST-001 | 새 게임 시작 테스트 | SCR-001에서 Day 1까지 이동 확인 |
| TEST-002 | 첫 선택지 테스트 | CHO-D01-001-A/B/C 선택 결과 확인 |
| TEST-003 | 자원 변화 테스트 | 선택지 변화값이 자원에 반영되는지 확인 |
| TEST-004 | Day 진행 테스트 | Day 1~Day 7 이동 확인 |
| TEST-005 | 밸런싱 루트 테스트 | BAL-001~BAL-007 흐름 확인 |
| TEST-006 | 최종 평가 테스트 | Day 7 결과 화면 표시 확인 |
| TEST-007 | 위험 자원 테스트 | 0/100 근접 시 경고 표시 확인 |

## 개발 단계 구분

### Phase 1 - 정적 MVP

- 화면 이동
- 정적 데이터 표시
- 선택지 선택
- 결과 표시

### Phase 2 - 계산 MVP

- 자원 변화 적용
- Day 진행
- 엔딩 플래그 누적
- 최종 평가 계산

### Phase 3 - 연출 MVP

- 문서 전환 연출
- 봉인 보고서 강조
- 자원 위험 표시
- 인물 반응 강조

### Phase 4 - 확장 준비

- 캐릭터 관계 상태 확장
- 암거래 단서 이벤트 확장
- 저장/불러오기
- 추가 Day 또는 챕터 구조

## 권장 기술 메모

아직 최종 엔진은 확정하지 않았으므로, MVP 구현 문서는 특정 엔진에 종속되지 않습니다.

다만 구조상 다음 방식과 잘 맞습니다.

```text
웹 기반 프로토타입
Godot UI 중심 프로토타입
Unity UI Toolkit 기반 프로토타입
Ren'Py + 경영 시뮬레이션 확장
```

초기에는 웹 기반 또는 Godot 기반 프로토타입이 빠르게 검증하기 좋습니다.

## 완료 기준

MVP 구현 1차 완료 기준은 다음과 같습니다.

```text
새 게임을 시작할 수 있다.
Day 1~Day 7까지 진행된다.
각 Day에서 최소 1개 이벤트가 나온다.
각 이벤트마다 선택지가 표시된다.
선택 결과로 자원이 변한다.
Day 7 종료 후 최종 평가가 나온다.
최소 3개 이상의 다른 결과 루트가 확인된다.
```

## 다음 작업

```text
docs/system-design/ENGINE_SELECTION_NOTES.md
docs/system-design/PROTOTYPE_TASK_LIST.md
```
