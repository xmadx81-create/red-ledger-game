# 웹 MVP 프로토타입 작업 목록

이 문서는 `red-ledger-game` 1차 웹 MVP를 실제로 만들기 위한 작업 목록입니다.

## 목적

기획, 데이터, Figma 화면 설계를 실제 동작하는 웹 프로토타입으로 옮기기 위한 실행 단위 작업을 정의합니다.

## 구현 방식 기준

현재 1차 MVP 권장 방식은 다음입니다.

```text
웹 기반 단일 페이지 프로토타입
```

기준 문서:

```text
docs/system-design/ENGINE_SELECTION_NOTES.md
docs/system-design/MVP_IMPLEMENTATION_PLAN.md
docs/ui-ux/UI_COMPONENT_SPEC.md
docs/ui-ux/SCREEN_DATA_EVENT_MAP.md
```

## 목표 산출물

```text
브라우저에서 실행 가능한 7일 운영 프로토타입
```

최소 완료 기준:

```text
새 게임 시작
Day 1~Day 7 진행
각 Day 이벤트 표시
선택지 선택
자원 변화 적용
인물 반응 표시
최종 평가 화면 출력
```

---

# Phase 0. 프로젝트 기본 구조

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| WEB-000 | 웹 MVP 폴더 구조 생성 | `src/web-mvp` 기준 폴더 구성 | 폴더/파일 구조 | 기본 파일 생성 | 높음 |
| WEB-001 | 기본 HTML 생성 | 앱 진입점 작성 | `src/web-mvp/index.html` | 브라우저에서 열림 | 높음 |
| WEB-002 | 기본 CSS 생성 | 다크 행정 누아르 스타일 기준 작성 | `src/web-mvp/styles.css` | 기본 레이아웃 표시 | 높음 |
| WEB-003 | 기본 JS 생성 | 앱 상태와 화면 렌더링 시작점 작성 | `src/web-mvp/app.js` | 콘솔 오류 없이 로드 | 높음 |
| WEB-004 | 데이터 폴더 생성 | JSON 데이터 저장 위치 생성 | `src/web-mvp/data/` | 데이터 파일 배치 가능 | 높음 |

---

# Phase 1. 데이터 변환

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| DATA-001 | 자원 데이터 JSON화 | `03_자원` 기준 데이터 변환 | `resources.json` | 9개 자원 로드 가능 | 높음 |
| DATA-002 | 캐릭터 데이터 JSON화 | `04_캐릭터` 기준 데이터 변환 | `characters.json` | 5명 캐릭터 로드 가능 | 높음 |
| DATA-003 | 이벤트 데이터 JSON화 | `05_이벤트` 기준 데이터 변환 | `events.json` | Day 1~7 이벤트 로드 가능 | 높음 |
| DATA-004 | 선택지 데이터 JSON화 | `06_선택지` 기준 데이터 변환 | `choices.json` | 23개 선택지 로드 가능 | 높음 |
| DATA-005 | 밸런싱 데이터 JSON화 | `07_밸런싱` 기준 테스트 루트 변환 | `balancing.json` | 7개 루트 참조 가능 | 중간 |

---

# Phase 2. 게임 상태 구조

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| STATE-001 | GameState 정의 | 현재 Day, 자원, 선택 이력, 플래그 구조 정의 | `gameState` 객체 | 초기 상태 생성 가능 | 높음 |
| STATE-002 | 새 게임 시작 함수 | 초기 자원과 Day 1 설정 | `startNewGame()` | 새 게임 버튼 동작 | 높음 |
| STATE-003 | Day 이동 함수 | 다음 Day로 진행 | `advanceDay()` | Day 1~7 이동 가능 | 높음 |
| STATE-004 | 이벤트 로드 함수 | Day별 이벤트 찾기 | `loadDayEvent(day)` | 해당 Day 이벤트 표시 | 높음 |
| STATE-005 | 엔딩 플래그 구조 | 선택지 결과 플래그 누적 | `endingFlags` | 플래그 누적 가능 | 중간 |

---

# Phase 3. 화면 렌더링

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| UI-001 | 타이틀 화면 | SCR-001 구현 | `renderTitleScreen()` | 새 게임 버튼 표시 | 높음 |
| UI-002 | 프롤로그 문서 화면 | SCR-002 구현 | `renderPrologueScreen()` | 문서 카드 표시 | 높음 |
| UI-003 | 부임 통지 화면 | SCR-003 구현 | `renderAssignmentScreen()` | 역할 안내 표시 | 높음 |
| UI-004 | 봉인 보고서 화면 | SCR-004 구현 | `renderSealedReportScreen()` | 봉인 보고서 표시 | 높음 |
| UI-005 | Day 시작 화면 | SCR-005 구현 | `renderDayStartScreen(day)` | Day 목표 표시 | 높음 |
| UI-006 | 자원 튜토리얼 화면 | SCR-006 구현 | `renderResourceTutorial()` | 주요 자원 표시 | 중간 |
| UI-007 | 이벤트/선택지 화면 | SCR-007 구현 | `renderEventScreen(eventId)` | 선택지 표시 | 높음 |
| UI-008 | 선택 결과 화면 | SCR-008 구현 | `renderResultScreen(choiceId)` | 결과 표시 | 높음 |
| UI-009 | 메인 운영 화면 | SCR-009 구현 | `renderMainOperationScreen()` | 자원/업무/인물 표시 | 높음 |
| UI-010 | 최종 평가 화면 | SCR-010 구현 | `renderFinalReport()` | 엔딩 결과 표시 | 높음 |

---

# Phase 4. 컴포넌트 구현

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| COMP-001 | ResourceBar 구현 | 핵심 자원 요약 | `createResourceBar()` | 자원 5개 이상 표시 | 높음 |
| COMP-002 | ResourceCard 구현 | 개별 자원 카드 | `createResourceCard()` | 상태별 표시 가능 | 높음 |
| COMP-003 | ReportCard 구현 | 보고서/문서 카드 | `createReportCard()` | 제목/본문 표시 | 높음 |
| COMP-004 | ChoiceCard 구현 | 선택지 카드 | `createChoiceCard()` | 클릭 가능 | 높음 |
| COMP-005 | ResultChangeCard 구현 | 결과 변화 표시 | `createResultChangeCard()` | 변화 요약 표시 | 높음 |
| COMP-006 | CharacterReactionPanel 구현 | 인물 반응 표시 | `createCharacterReactionPanel()` | 반응 표시 | 중간 |
| COMP-007 | BottomNav 구현 | 하단 메뉴 | `createBottomNav()` | 기본 메뉴 표시 | 낮음 |

---

# Phase 5. 선택지 처리 로직

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| LOGIC-001 | 선택지 클릭 처리 | 선택지ID를 받아 결과 적용 | `handleChoice(choiceId)` | 클릭 시 결과 계산 | 높음 |
| LOGIC-002 | 자원 변화 적용 | 선택지 변화값을 자원에 반영 | `applyResourceChanges()` | 0~100 범위 보정 | 높음 |
| LOGIC-003 | 인물 반응 적용 | 선택지의 인물 반응 표시 | `applyCharacterReaction()` | 반응 패널 갱신 | 중간 |
| LOGIC-004 | 관계 변화 적용 | 관계 상태 갱신 | `applyRelationshipChanges()` | 상태 저장 가능 | 중간 |
| LOGIC-005 | 엔딩 플래그 누적 | 선택지 플래그 기록 | `applyEndingFlag()` | 플래그 카운트 가능 | 높음 |
| LOGIC-006 | 수요/공급 판정 | 혈액 재고 - 혈액 수요 계산 | `checkSupplyBalance()` | 부족/적정/과잉 판정 | 높음 |

---

# Phase 6. 최종 평가

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| END-001 | 최종 평가 함수 | Day 7 종료 후 결과 산출 | `calculateFinalReport()` | 엔딩 타입 반환 | 높음 |
| END-002 | 엔딩 플래그 우선순위 | 어떤 플래그를 우선할지 정의 | `endingPriority` | 주요 루트 판정 | 높음 |
| END-003 | 최종 자원 요약 | 마지막 자원값 표시 | `finalResourceSummary` | SCR-010 표시 | 높음 |
| END-004 | 다음 회차 힌트 | 후속 위험 요소 표시 | `nextRunHints` | 회차 욕구 제공 | 중간 |

---

# Phase 7. 테스트

| 작업ID | 작업명 | 설명 | 산출물 | 완료 기준 | 우선순위 |
|---|---|---|---|---|---|
| TEST-001 | 새 게임 테스트 | SCR-001에서 시작 | 테스트 결과 | Day 1 진입 | 높음 |
| TEST-002 | Day 진행 테스트 | Day 1~7 진행 | 테스트 결과 | Day 7 도달 | 높음 |
| TEST-003 | 선택지 23개 테스트 | 모든 선택지 클릭 가능 여부 | 테스트 결과 | 오류 없음 | 높음 |
| TEST-004 | 자원 변화 테스트 | 모든 변화값 반영 확인 | 테스트 결과 | 0~100 범위 유지 | 높음 |
| TEST-005 | 밸런싱 루트 테스트 | BAL-001~BAL-007 흐름 재현 | 테스트 결과 | 예상 플래그 출력 | 중간 |
| TEST-006 | 최종 평가 테스트 | SCR-010 정상 출력 | 테스트 결과 | 엔딩 표시 | 높음 |
| TEST-007 | 모바일 화면 테스트 | Galaxy S25 기준 확인 | 테스트 결과 | 가로 스크롤 없음 | 중간 |

---

# 우선 작업 10개

실제 개발을 시작할 때는 아래 10개부터 진행합니다.

```text
WEB-000 웹 MVP 폴더 구조 생성
WEB-001 기본 HTML 생성
WEB-002 기본 CSS 생성
WEB-003 기본 JS 생성
DATA-001 자원 데이터 JSON화
DATA-002 캐릭터 데이터 JSON화
DATA-003 이벤트 데이터 JSON화
DATA-004 선택지 데이터 JSON화
STATE-001 GameState 정의
STATE-002 새 게임 시작 함수
```

## 다음 작업

```text
src/README.md 업데이트
src/web-mvp 폴더 구조 생성
초기 HTML/CSS/JS 파일 생성
```
