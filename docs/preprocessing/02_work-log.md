# 적혈의 장부 — 전처리 단계 작업로그

## 기록 원칙

각 작업은 아래 형식으로 남긴다.

```text
날짜/시간:
작업자:
작업 구분:
작업 내용:
결과:
다음 조치:
```

---

## 로그

### 2026-06-16 1차 기록

작업자: ChatGPT + 백무결  
작업 구분: 전처리 단계 시작 / 저장 구조 설계  
작업 내용:
- 게임 제작용 연동 앱 준비 대상을 확정했다.
- 대상 앱은 GitHub, Google Drive, Google Sheets, Figma, Google Calendar, Gmail이다.
- 전처리 단계 기록과 체크리스트를 저장할 기준 위치를 먼저 정하기로 했다.
- GitHub 저장소 내부 `docs/preprocessing/` 폴더를 공식 기준 저장소로 제안했다.
- GitHub 커넥터에서 설치 계정 `xmadx81-create`와 저장소 `xmadx81-create/red-ledger-game`을 확인했다.

결과:
- 전처리 단계 문서 구조를 확정했다.
- GitHub `docs/preprocessing/`에 전처리 문서 저장을 시작했다.

다음 조치:
1. 전처리 문서 전체 업로드 완료
2. GitHub 이슈 `[PRE-0] 제작 환경 전처리` 생성
3. Google Drive 폴더 구조 준비

---

### 2026-06-16 2차 기록

작업자: ChatGPT + 백무결  
작업 구분: GitHub 전처리 저장소 구축 완료  
작업 내용:
- `xmadx81-create/red-ledger-game` 저장소 접근을 확인했다.
- `docs/preprocessing/` 경로에 전처리 문서를 생성했다.
- 생성 파일:
  - `00_preprocessing-index.md`
  - `01_integration-checklist.md`
  - `02_work-log.md`
  - `03_storage-map.md`
  - `04_decision-log.md`
  - `05_next-actions.md`
  - `integration-checklist.csv`
- GitHub Issue #1 `[PRE-0] 제작 환경 전처리`를 생성했다.
- 라벨 `preprocessing`, `docs`, `integration`을 적용했다.

결과:
- GitHub 전처리 저장 구조 구축 완료.
- 이후 작업은 Issue #1과 전처리 문서에 이어서 기록한다.

다음 조치:
1. Google Drive 폴더 구조 생성
2. Google Sheets 마스터 시트 설계
3. Figma UI 파일 또는 링크 등록
4. Google Calendar 개발 일정 생성
5. Gmail 공유/요청 템플릿 작성
