# 데이터 무결성 점검 기준

이 문서는 `red-ledger-game`의 Google Sheets 반영 전 CSV 데이터 간 ID 연결, 명칭 일치, 참조 관계를 점검하기 위한 기준입니다.

## 목적

실제 Google Sheets에 데이터를 반영하기 전에 다음 오류를 줄입니다.

- 이벤트ID 불일치
- 선택지ID 불일치
- 캐릭터명 불일치
- Day 구조 불일치
- 밸런싱 선택 흐름 오류
- UI 화면ID와 Figma 프레임명 불일치
- 자원명 불일치

## 점검 대상 파일

```text
docs/data-design/templates/characters-template.csv
docs/data-design/templates/events-template.csv
docs/data-design/templates/choices-template.csv
docs/data-design/templates/choices-template-day5-7.csv
docs/data-design/templates/balancing-test-template.csv
docs/data-design/templates/ui-screen-list-template.csv
```

## 필수 점검 항목

| 항목 | 기준 |
|---|---|
| 캐릭터ID | `CHR-001` 형식 |
| 이벤트ID | `EVT-D01-001` 형식 |
| 선택지ID | `CHO-D01-001-A` 형식 |
| 화면ID | `SCR-001` 형식 |
| 밸런싱ID | `BAL-001` 형식 |
| Day | Day 1~Day 7 순서 유지 |
| 이벤트-선택지 연결 | 모든 선택지는 존재하는 이벤트ID를 참조해야 함 |
| 밸런싱-선택지 연결 | 선택 흐름의 모든 선택지ID가 실제 선택지 CSV에 있어야 함 |
| 캐릭터명 | 이벤트/선택지의 인물명은 캐릭터 CSV 이름과 일치해야 함 |
| 자원명 | 계산용 자원명은 핵심 자원 시스템 문서 기준을 따름 |

## 자원명 기준

계산과 데이터 기준명은 다음을 사용합니다.

```text
혈액 재고
혈액 수요
가문 자금
인간 신뢰
언론 노출
보안 등급
가문 만족도
조직 불안
암거래 단서
```

UI 노출명은 장면 연출에 따라 다르게 쓸 수 있으나, 데이터 컬럼명은 위 기준을 우선합니다.

## 선택지 파일 분할 기준

선택지 데이터는 길이 문제를 줄이기 위해 두 파일로 분리했습니다.

```text
choices-template.csv
choices-template-day5-7.csv
```

실제 Google Sheets에서는 둘 다 `06_선택지` 탭에 이어 붙입니다.

주의:

- 두 번째 파일을 붙일 때 헤더 행은 중복 삽입하지 않는 것이 좋습니다.
- Day 5~Day 7 선택지는 Day 1~Day 4 데이터 아래에 붙입니다.

## 점검 상태 표기

| 상태 | 의미 |
|---|---|
| 통과 | 현재 기준에서 문제 없음 |
| 주의 | 의도된 차이 또는 수동 확인 필요 |
| 수정필요 | Google Sheets 반영 전 수정 필요 |
| 보류 | 실제 구현 단계에서 재검토 |
