# 적혈의 장부 — 전처리 단계 인덱스

작성일: 2026-06-16

## 1. 전처리 단계 정의

이 단계의 목적은 실제 게임 개발에 들어가기 전에, 제작 환경과 자료 저장 구조를 먼저 고정하는 것이다.

대상 연동 앱:

1. GitHub
2. Google Drive
3. Google Sheets
4. Figma
5. Google Calendar
6. Gmail

## 2. 공식 기록 저장 기준

### 1순위 저장소

GitHub 저장소 내부에 아래 폴더를 만든다.

```text
red-ledger-game/
└─ docs/
   └─ preprocessing/
      ├─ 00_preprocessing-index.md
      ├─ 01_integration-checklist.md
      ├─ 02_work-log.md
      ├─ 03_storage-map.md
      ├─ 04_decision-log.md
      └─ 05_next-actions.md
```

### 2순위 보조 저장소

Google Drive에는 같은 내용을 사람이 보기 쉬운 문서/시트 형태로 복제한다.

```text
Google Drive/
└─ 게임제작/
   └─ 적혈의 장부/
      └─ 00_전처리/
```

## 3. 운영 원칙

- 모든 작업은 `02_work-log.md`에 날짜순으로 남긴다.
- 연결 앱별 준비 상태는 `01_integration-checklist.md`에서 관리한다.
- 저장 위치와 파일 역할은 `03_storage-map.md`에서 관리한다.
- 중요한 결정은 `04_decision-log.md`에 기록한다.
- 다음 할 일은 `05_next-actions.md`에서 관리한다.

## 4. 첫 번째 결정

전처리 단계의 공식 기준 저장소는 GitHub의 `docs/preprocessing/` 폴더로 한다.

GitHub는 코드와 문서를 함께 추적하기 좋고, 이후 변경 이력과 작업 지시를 남기기에도 적합하다.
