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

---

### 작업 주제 3

GitHub 작업 규칙, 문서 저장 규칙, AI 협업 인수인계 기준 정리

### 진행 내용

1. GitHub 작업 규칙 문서 `docs/operations/GITHUB_WORKFLOW.md`를 생성했다.
2. 문서 저장 규칙 문서 `docs/operations/DOCUMENT_RULES.md`를 생성했다.
3. AI 협업 인수인계 문서 `docs/operations/AI_COLLABORATION_GUIDE.md`를 생성했다.
4. `CHECKLIST.md`에서 다음 항목을 완료 처리했다.
   - 이슈/브랜치/커밋 규칙 정리
   - 문서 저장 규칙 정리
   - Claude AI와 공유할 프로젝트 기준 문서 정리

### 결정 사항

- GitHub를 프로젝트의 최종 기준 저장소로 사용한다.
- Google Drive는 원본/대용량/공유 자료 보관소로 사용한다.
- Google Sheets는 표 데이터와 밸런싱 데이터를 관리한다.
- Figma는 UI/UX와 와이어프레임을 관리한다.
- Google Calendar는 일정과 마감일을 관리한다.
- Gmail은 알림, 공유, 외부 전달 기록을 관리한다.
- 새 세션 또는 외부 AI가 이어받을 때는 `AI_COLLABORATION_GUIDE.md`를 기준 인수인계 문서로 사용한다.

---

### 작업 주제 4

Google Drive 저장 구조 기준 정리

### 진행 내용

1. Google Drive 저장 구조 문서 `docs/operations/GOOGLE_DRIVE_STRUCTURE.md`를 생성했다.
2. Google Drive 최상위 폴더명을 `red-ledger-game_적혈의장부`로 결정했다.
3. Google Drive 하위 폴더 구조를 다음과 같이 정리했다.
   - `00_admin/`
   - `01_planning/`
   - `02_references/`
   - `03_design/`
   - `04_data/`
   - `05_exports/`
   - `06_meetings/`
   - `99_archive/`
4. GitHub와 Google Drive의 역할 분리를 명확히 정리했다.
5. `CHECKLIST.md`에서 Google Drive 저장 구조 관련 항목을 완료 처리했다.
6. 실제 Google Drive 폴더 생성 및 공유 권한 확인은 별도 확인 항목으로 남겼다.

### 결정 사항

- GitHub는 최종 기준 문서와 이력 관리용 저장소로 사용한다.
- Google Drive는 원본 파일, 대용량 자료, 공유용 문서 보관소로 사용한다.
- Google Drive에는 비밀번호, API 키, 토큰, 비밀키를 저장하지 않는다.
- 새 세션에서는 GitHub의 `GOOGLE_DRIVE_STRUCTURE.md`를 먼저 확인한 뒤 실제 Drive 폴더를 찾는다.

---

### 작업 주제 5

Google Sheets 관리표 구조 기준 정리

### 진행 내용

1. Google Sheets 관리표 구조 문서 `docs/data-design/GOOGLE_SHEETS_STRUCTURE.md`를 생성했다.
2. 권장 스프레드시트명을 `red-ledger-game_적혈의장부_관리표`로 결정했다.
3. 다음 탭 구조를 설계했다.
   - `00_대시보드`
   - `01_작업목록`
   - `02_MVP_7일구조`
   - `03_자원`
   - `04_캐릭터`
   - `05_이벤트`
   - `06_선택지`
   - `07_밸런싱`
   - `08_UI화면목록`
   - `99_변경로그`
4. 실제 Google Sheets에 붙여 넣을 수 있는 CSV 템플릿 3종을 생성했다.
   - `docs/data-design/templates/task-list-template.csv`
   - `docs/data-design/templates/resources-template.csv`
   - `docs/data-design/templates/mvp-7days-template.csv`
5. `CHECKLIST.md`에서 Google Sheets 관리표 구조 관련 항목을 완료 처리했다.
6. 실제 Google Sheets 파일 생성과 CSV 반영은 별도 확인 항목으로 남겼다.

### 결정 사항

- Google Sheets는 작업표, 자원표, 캐릭터표, 이벤트표, 선택지표, 밸런싱표를 관리하는 도구로 사용한다.
- GitHub는 Sheets 구조의 기준 문서와 변경 이력을 보관한다.
- Sheets 구조 변경 시 `99_변경로그`에 먼저 기록하고, 확정 후 GitHub 문서에도 반영한다.
- 1차 MVP는 `02_MVP_7일구조` 탭을 기준으로 Day 1~Day 7 구조를 관리한다.

### 다음 작업

1. Google Sheets 실제 파일 생성 확인
2. CSV 템플릿을 실제 시트에 반영
3. Figma 화면 설계 기준 정리
4. Calendar 일정 운영 기준 정리
5. Gmail 알림 및 공유 기준 정리
