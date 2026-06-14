# 전처리 단계 작업 로그

이 문서는 `red-ledger-game` 프로젝트의 전처리 단계에서 실제로 진행한 작업, 확인한 사항, 결정한 내용을 기록합니다.

---

## 2026-06-15

### 작업 주제 1

GitHub 저장소 연결 및 전처리 단계 기록 체계 생성

### 진행 내용

1. ChatGPT와 GitHub 계정 연결 상태를 확인했다.
2. GitHub 계정 `xmadx81-create`가 연결되어 있음을 확인했다.
3. 초기에는 `red-ledger-game` 저장소가 ChatGPT 커넥터에서 보이지 않았다.
4. GitHub App 설치/권한 화면을 확인하며 저장소 접근 권한 문제를 점검했다.
5. 최종적으로 `xmadx81-create/red-ledger-game` 저장소 접근이 성공했다.
6. 저장소 정보 확인 결과 다음 상태를 확인했다.
   - 저장소명: `red-ledger-game`
   - 전체 경로: `xmadx81-create/red-ledger-game`
   - 공개 범위: Private
   - 기본 브랜치: `main`
   - ChatGPT 권한: admin, maintain, pull, push, triage
7. 전처리 단계 기록 경로를 `docs/preprocessing/`로 결정했다.
8. 다음 문서를 생성했다.
   - `docs/preprocessing/README.md`
   - `docs/preprocessing/CHECKLIST.md`
   - `docs/preprocessing/WORK_LOG.md`

### 결정 사항

- 전처리 단계는 본격적인 게임 개발 이전의 준비 단계로 관리한다.
- 전처리 단계 기록은 GitHub 저장소의 `docs/preprocessing/` 경로에 남긴다.
- 우선 준비할 연동 도구 순서는 다음과 같이 확정한다.
  1. GitHub
  2. Google Drive
  3. Google Sheets
  4. Figma
  5. Google Calendar
  6. Gmail
- 앞으로 중요한 작업은 `WORK_LOG.md`에 누적 기록한다.
- 준비할 항목과 완료 여부는 `CHECKLIST.md`에서 관리한다.

---

### 작업 주제 2

GitHub 기본 폴더 구조 정리

### 진행 내용

1. 프로젝트 기본 폴더 구조 문서 `docs/PROJECT_STRUCTURE.md`를 생성했다.
2. GitHub에 빈 폴더가 유지되지 않는 특성을 고려하여 각 주요 폴더에 `README.md`를 생성했다.
3. 다음 폴더 기준 문서를 생성했다.
   - `docs/game-design/README.md`
   - `docs/system-design/README.md`
   - `docs/data-design/README.md`
   - `docs/ui-ux/README.md`
   - `docs/operations/README.md`
   - `assets/references/README.md`
   - `assets/concept-art/README.md`
   - `src/README.md`
4. `CHECKLIST.md`에서 GitHub 기본 폴더 구조 정리 항목을 완료 처리했다.
5. 전처리 단계 완료 조건 중 GitHub 문서 구조 확정 항목을 완료 처리했다.

### 결정 사항

- 문서 자료는 `docs/` 아래에서 관리한다.
- 기획 문서는 `docs/game-design/`에 둔다.
- 시스템 규칙과 내부 구조는 `docs/system-design/`에 둔다.
- 데이터 구조와 시트 설계는 `docs/data-design/`에 둔다.
- UI/UX와 Figma 관련 기준은 `docs/ui-ux/`에 둔다.
- 일정, 회의록, 협업 전달문은 `docs/operations/`에 둔다.
- 레퍼런스와 컨셉 이미지는 `assets/` 아래에서 관리한다.
- 실제 실행 코드는 `src/` 아래에서 관리한다.

### 다음 작업

1. 이슈/브랜치/커밋 규칙 정리
2. 문서 저장 규칙 정리
3. Claude AI와 공유할 프로젝트 기준 문서 정리
4. Google Drive 저장 위치 결정
5. Google Sheets 관리표 구조 초안 작성
