# 본격 기획 단계 작업 로그 부록 - Google Sheets용 XLSX 원본 생성

## 작업 주제

실제 Google Sheets 반영용 XLSX 원본 생성

## 진행 내용

1. GitHub에 저장된 기획 문서와 CSV 템플릿을 기준으로 Google Sheets에 업로드 가능한 XLSX 원본 파일을 생성했다.
2. 생성 파일명은 `red-ledger-game_google-sheets-template.xlsx`로 정리했다.
3. 시트 구성은 Google Sheets 관리표 기준과 동일하게 맞췄다.
4. 선택지 데이터는 Day 1~Day 7 전체 23개를 하나의 `06_선택지` 시트에 통합했다.
5. 밸런싱 계산을 위해 `07_밸런싱_상세` 보조 시트를 추가했다.
6. `07_밸런싱` 시트에는 선택지 변화값을 합산해 최종 자원값을 계산하는 수식을 반영했다.
7. 수식 오류 검색 결과 주요 오류는 발견되지 않았다.

## 생성한 XLSX 시트

```text
00_대시보드
01_작업목록
02_MVP_7일구조
03_자원
04_캐릭터
05_이벤트
06_선택지
07_밸런싱_상세
07_밸런싱
08_UI화면목록
99_변경로그
```

## 주요 데이터 수량

```text
캐릭터: 5명
이벤트: 7개
선택지: 23개
밸런싱 루트: 7개
UI 화면: 10개
```

## 밸런싱 루트

```text
BAL-001 중용 기본 루트
BAL-002 가문 우선 루트
BAL-003 인간 사회 우선 루트
BAL-004 공급 붕괴 루트
BAL-005 암거래 잠식 루트
BAL-006 내부 붕괴 루트
BAL-007 언론 노출 루트
```

## 결정 사항

- 실제 Google Sheets로 반영할 때는 생성된 XLSX 파일을 Google Drive에 업로드한 뒤 Google Sheets로 열어 사용한다.
- GitHub에는 XLSX 원본 자체가 아니라 생성 이력과 기준 문서를 기록한다.
- 이후 Google Sheets 링크가 확정되면 `docs/data-design/GOOGLE_SHEETS_IMPORT_SUMMARY.md` 또는 별도 링크 기록 문서에 반영한다.

## 다음 작업

1. XLSX 파일을 Google Drive에 업로드
2. Google Sheets로 열기
3. 각 시트와 수식이 정상 유지되는지 확인
4. 실제 Google Sheets 링크를 GitHub 문서에 기록
5. 밸런싱 루트별 수치 조정
