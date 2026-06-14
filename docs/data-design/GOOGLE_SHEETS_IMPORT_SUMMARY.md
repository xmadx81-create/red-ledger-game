# Google Sheets 반영용 요약

이 문서는 GitHub에 생성된 CSV 템플릿을 실제 Google Sheets 관리표에 반영하기 위한 요약입니다.

## 목적

본격 기획 단계에서 작성한 게임 기획 문서를 Google Sheets 데이터 구조로 옮기기 위한 기준을 정리합니다.

Google Sheets 파일명 기준:

```text
red-ledger-game_적혈의장부_관리표
```

## 반영 대상 CSV 목록

| Google Sheets 탭 | GitHub CSV 템플릿 | 상태 |
|---|---|---|
| `01_작업목록` | `docs/data-design/templates/task-list-template.csv` | 기존 생성 |
| `02_MVP_7일구조` | `docs/data-design/templates/mvp-7days-template.csv` | 기존 생성 |
| `03_자원` | `docs/data-design/templates/resources-template.csv` | 기존 생성 |
| `04_캐릭터` | `docs/data-design/templates/characters-template.csv` | 신규 생성 |
| `05_이벤트` | `docs/data-design/templates/events-template.csv` | 신규 생성 |
| `06_선택지` | `docs/data-design/templates/choices-template.csv` | 신규 생성 |
| `06_선택지` | `docs/data-design/templates/choices-template-day5-7.csv` | 신규 생성 |
| `07_밸런싱` | `docs/data-design/templates/balancing-test-template.csv` | 신규 생성 |
| `08_UI화면목록` | `docs/data-design/templates/ui-screen-list-template.csv` | 신규 생성 |

## 실제 반영 순서

권장 반영 순서는 다음과 같습니다.

```text
1. 03_자원
2. 02_MVP_7일구조
3. 04_캐릭터
4. 05_이벤트
5. 06_선택지
6. 07_밸런싱
7. 08_UI화면목록
8. 01_작업목록
9. 99_변경로그
```

이유:

- 자원이 먼저 있어야 이벤트와 선택지의 변화값을 해석할 수 있습니다.
- MVP 7일 구조가 먼저 있어야 이벤트의 Day 기준을 확인할 수 있습니다.
- 캐릭터가 먼저 있어야 이벤트의 관련 인물 필드를 연결할 수 있습니다.
- 이벤트가 먼저 있어야 선택지의 `이벤트ID`를 연결할 수 있습니다.
- 선택지가 먼저 있어야 밸런싱 테스트의 선택 흐름을 검증할 수 있습니다.

## 신규 생성된 데이터 템플릿 요약

### 04_캐릭터

파일:

```text
docs/data-design/templates/characters-template.csv
```

포함 내용:

- 서윤재 실장
- 김도현 과장
- 박세연 팀장
- 정하린 기자
- 엘리엇 카르테인

주요 필드:

```text
캐릭터ID, 이름, 직책, 종족, 초기관계, RPG식역할, 적혈의장부식역할, 등급방향, 능력치, 고유스킬, 개인서사요약
```

### 05_이벤트

파일:

```text
docs/data-design/templates/events-template.csv
```

포함 내용:

- Day 1 첫 운영 보고
- Day 2 예상보다 큰 수요
- Day 3 기자의 첫 질문
- Day 4 사라진 운송량
- Day 5 원로의 추가 요구
- Day 6 암거래망의 실체
- Day 7 최종 운영 보고

### 06_선택지

파일:

```text
docs/data-design/templates/choices-template.csv
docs/data-design/templates/choices-template-day5-7.csv
```

선택지 데이터는 길이가 길어 Day 1~Day 4와 Day 5~Day 7로 나누어 저장했습니다.

Google Sheets에는 같은 `06_선택지` 탭에 이어 붙이면 됩니다.

### 07_밸런싱

파일:

```text
docs/data-design/templates/balancing-test-template.csv
```

포함 테스트 루트:

- 중용 기본 루트
- 가문 우선 루트
- 인간 사회 우선 루트
- 공급 붕괴 루트
- 암거래 잠식 루트
- 내부 붕괴 루트
- 언론 노출 루트

### 08_UI화면목록

파일:

```text
docs/data-design/templates/ui-screen-list-template.csv
```

포함 화면:

- 타이틀 화면
- 프롤로그 문서 화면
- 부임 통지 화면
- 봉인 보고서 화면
- Day 1 시작 보고
- 핵심 자원 튜토리얼
- 첫 선택지 화면
- 선택 결과 화면
- 메인 운영 화면
- 최종 평가 화면

## 반영 후 확인할 것

- `이벤트ID`가 이벤트 탭과 선택지 탭에서 일치하는지 확인합니다.
- `선택지ID`가 밸런싱 탭의 선택 흐름에 정확히 연결되는지 확인합니다.
- 캐릭터 이름이 캐릭터 탭과 이벤트 탭에서 동일한지 확인합니다.
- UI 화면ID가 Figma 프레임명과 연결되는지 확인합니다.
- 자원명은 `CORE_RESOURCE_SYSTEM.md`의 자원명과 동일하게 유지합니다.

## 변경로그 기록 예시

`99_변경로그` 탭에는 다음과 같이 기록합니다.

```text
변경일: 2026-06-15
변경자: 백무결
변경대상: Google Sheets 초기 데이터 템플릿
변경내용: 캐릭터, 이벤트, 선택지, 밸런싱, UI화면목록 CSV 반영
변경이유: 본격 기획 단계 데이터 관리 시작
관련문서: docs/data-design/GOOGLE_SHEETS_IMPORT_SUMMARY.md
```

## 다음 작업

1. 실제 Google Sheets 파일 생성
2. CSV 템플릿을 각 탭에 반영
3. 선택지 ID와 이벤트 ID 연결 검토
4. 밸런싱 루트 1차 계산
5. Figma 화면ID와 UI화면목록 연결
