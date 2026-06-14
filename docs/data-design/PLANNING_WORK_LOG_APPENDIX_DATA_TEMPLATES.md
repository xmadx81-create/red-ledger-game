# 본격 기획 단계 작업 로그 부록 - 데이터 템플릿

## 작업 주제

기획 문서 기반 Google Sheets 데이터 템플릿 생성

## 진행 내용

1. 주요 인물 설정을 바탕으로 `characters-template.csv`를 생성했다.
2. MVP 7일 운영 구조와 이벤트 구조를 바탕으로 `events-template.csv`를 생성했다.
3. Day 1~Day 4 선택지 데이터로 `choices-template.csv`를 생성했다.
4. Day 5~Day 7 선택지 데이터로 `choices-template-day5-7.csv`를 생성했다.
5. 첫 화면 흐름과 화면 목록 기준을 바탕으로 `ui-screen-list-template.csv`를 생성했다.
6. 주요 엔딩 플래그와 선택 흐름 검증을 위해 `balancing-test-template.csv`를 생성했다.
7. 실제 Google Sheets 반영 순서와 확인 기준을 정리한 `GOOGLE_SHEETS_IMPORT_SUMMARY.md`를 생성했다.

## 생성한 파일

```text
docs/data-design/templates/characters-template.csv
docs/data-design/templates/events-template.csv
docs/data-design/templates/choices-template.csv
docs/data-design/templates/choices-template-day5-7.csv
docs/data-design/templates/ui-screen-list-template.csv
docs/data-design/templates/balancing-test-template.csv
docs/data-design/GOOGLE_SHEETS_IMPORT_SUMMARY.md
```

## 결정 사항

- 선택지 데이터는 길이가 길어 Day 1~Day 4와 Day 5~Day 7로 나누어 관리한다.
- Google Sheets 실제 반영 시에는 두 선택지 CSV를 같은 `06_선택지` 탭에 이어 붙인다.
- 밸런싱 테스트는 중용, 가문 우선, 인간 사회 우선, 공급 붕괴, 암거래 잠식, 내부 붕괴, 언론 노출 루트로 시작한다.
- UI 화면목록은 Figma 프레임명과 같은 화면ID를 사용한다.

## 다음 작업

1. 실제 Google Sheets 파일 생성
2. CSV 템플릿을 실제 시트에 반영
3. 밸런싱 루트별 최종 자원값 계산
4. Figma 와이어프레임 작성
