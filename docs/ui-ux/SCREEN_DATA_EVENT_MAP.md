# 화면-데이터-이벤트 연결표

이 문서는 MVP 화면, Google Sheets 데이터, 이벤트/선택지 구조를 연결하기 위한 기준표입니다.

## 목적

화면 설계와 실제 데이터 구조가 따로 놀지 않도록, 각 화면이 어떤 데이터와 연결되는지 명확히 기록합니다.

## 기준 파일

```text
Figma: https://www.figma.com/design/JmrFNGQidVXyZu52IdmgxK
Google Sheets: https://docs.google.com/spreadsheets/d/1X3WIqdhriczNpfFV0VAh6JeUfgCc_taGnz1dKASnMGg/edit
GitHub Repo: xmadx81-create/red-ledger-game
```

## 화면별 연결 기준

| 화면ID | 화면명 | 주요 데이터 탭 | 이벤트ID | 선택지ID | 주요 컴포넌트 |
|---|---|---|---|---|---|
| SCR-001 | 타이틀 화면 | 08_UI화면목록 | 없음 | 없음 | Button |
| SCR-002 | 프롤로그 문서 화면 | 08_UI화면목록 | 없음 | 없음 | ReportCard, Button |
| SCR-003 | 부임 통지 화면 | 08_UI화면목록, 04_캐릭터 | 없음 | 없음 | ReportCard, Button |
| SCR-004 | 봉인 보고서 화면 | 03_자원, 08_UI화면목록 | 없음 | 없음 | ReportCard, Button |
| SCR-005 | Day 1 시작 보고 | 02_MVP_7일구조, 03_자원 | EVT-D01-001 | 없음 | HeaderStatus, ReportCard |
| SCR-006 | 핵심 자원 튜토리얼 | 03_자원 | EVT-D01-001 | 없음 | ResourceBar, ResourceCard, ReportCard |
| SCR-007 | 첫 선택지 화면 | 05_이벤트, 06_선택지 | EVT-D01-001 | CHO-D01-001-A/B/C | ResourceBar, ReportCard, ChoiceCard |
| SCR-008 | 선택 결과 화면 | 06_선택지, 04_캐릭터 | EVT-D01-001 | 선택된 선택지 | ReportCard, ResultChangeCard |
| SCR-009 | 메인 운영 화면 | 02_MVP_7일구조, 03_자원, 04_캐릭터, 05_이벤트 | Day별 이벤트 | Day별 선택지 | HeaderStatus, ResourceBar, ReportCard, CharacterReactionPanel, BottomNav |
| SCR-010 | 최종 평가 화면 | 07_밸런싱, 07_밸런싱_상세, 03_자원 | EVT-D07-001 | CHO-D07-001-A/B/C/D | FinalReportPanel, ResourceCard, ReportCard, BottomNav |

## Day별 이벤트 연결

| Day | 화면 흐름 | 이벤트ID | 선택지 그룹 |
|---|---|---|---|
| Day 1 | SCR-005 → SCR-006 → SCR-007 → SCR-008 → SCR-009 | EVT-D01-001 | CHO-D01-001-A/B/C |
| Day 2 | SCR-009 내부 사건 카드 | EVT-D02-001 | CHO-D02-001-A/B/C |
| Day 3 | SCR-009 내부 사건 카드 | EVT-D03-001 | CHO-D03-001-A/B/C |
| Day 4 | SCR-009 내부 사건 카드 | EVT-D04-001 | CHO-D04-001-A/B/C |
| Day 5 | SCR-009 내부 사건 카드 | EVT-D05-001 | CHO-D05-001-A/B/C |
| Day 6 | SCR-009 내부 사건 카드 | EVT-D06-001 | CHO-D06-001-A/B/C/D |
| Day 7 | SCR-009 → SCR-010 | EVT-D07-001 | CHO-D07-001-A/B/C/D |

## 자원 표시 연결

| UI 표시명 | 데이터 기준명 | Google Sheets 탭 | 비고 |
|---|---|---|---|
| 핵심 재고 | 혈액 재고 | 03_자원, 06_선택지, 07_밸런싱 | UI용 축약명 |
| 이면 수요 | 혈액 수요 | 03_자원, 06_선택지, 07_밸런싱 | UI용 축약명 |
| 신뢰 | 인간 신뢰 | 03_자원, 06_선택지, 07_밸런싱 | UI용 축약명 |
| 노출 | 언론 노출 | 03_자원, 06_선택지, 07_밸런싱 | UI용 축약명 |
| 가문 | 가문 만족도 | 03_자원, 06_선택지, 07_밸런싱 | UI용 축약명 |
| 보안 | 보안 등급 | 03_자원, 06_선택지, 07_밸런싱 | Day 2 이후 확장 |
| 불안 | 조직 불안 | 03_자원, 06_선택지, 07_밸런싱 | Day 4 이후 강조 |
| 단서 | 암거래 단서 | 03_자원, 06_선택지, 07_밸런싱 | Day 4 이후 강조 |

## 구현 기준

1. 화면ID는 Figma, Google Sheets, 코드에서 동일하게 사용합니다.
2. 이벤트ID는 `05_이벤트` 탭을 기준으로 합니다.
3. 선택지ID는 `06_선택지` 탭을 기준으로 합니다.
4. 자원 계산은 `03_자원`, `06_선택지`, `07_밸런싱`을 기준으로 합니다.
5. 플레이어 UI에서는 숫자 전체를 노출하지 않고 방향성 중심으로 표시합니다.

## 다음 작업

```text
docs/system-design/MVP_IMPLEMENTATION_PLAN.md
```
