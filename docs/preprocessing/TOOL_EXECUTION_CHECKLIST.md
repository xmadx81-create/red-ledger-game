# 실제 도구 생성용 실행 체크리스트

이 문서는 전처리 단계에서 GitHub에 정의한 기준을 실제 외부 도구에 반영하기 위한 실행 체크리스트입니다.

## 목적

지금까지 GitHub에는 다음 도구들의 기준 구조를 문서화했습니다.

- GitHub
- Google Drive
- Google Sheets
- Figma
- Google Calendar
- Gmail

이 문서는 각 도구에서 실제 폴더, 파일, 캘린더, 라벨 등을 생성하고 GitHub 기준과 연결되었는지 확인하기 위한 실행용 문서입니다.

---

## 1. Google Drive 실제 생성

### 생성할 최상위 폴더

```text
red-ledger-game_적혈의장부
```

### 생성할 하위 폴더

```text
00_admin/
01_planning/
02_references/
03_design/
04_data/
05_exports/
06_meetings/
99_archive/
```

### 체크리스트

- [ ] Google Drive 최상위 폴더 생성
- [ ] `00_admin/` 생성
- [ ] `01_planning/` 생성
- [ ] `02_references/` 생성
- [ ] `03_design/` 생성
- [ ] `04_data/` 생성
- [ ] `05_exports/` 생성
- [ ] `06_meetings/` 생성
- [ ] `99_archive/` 생성
- [ ] 공유 권한 기본값 비공개 확인
- [ ] 필요한 경우에만 개별 파일 공유 원칙 확인
- [ ] 실제 Drive 링크를 GitHub 문서에 기록

관련 기준 문서:

```text
docs/operations/GOOGLE_DRIVE_STRUCTURE.md
```

---

## 2. Google Sheets 실제 생성

### 생성할 스프레드시트명

```text
red-ledger-game_적혈의장부_관리표
```

### 생성할 탭

```text
00_대시보드
01_작업목록
02_MVP_7일구조
03_자원
04_캐릭터
05_이벤트
06_선택지
07_밸런싱
08_UI화면목록
99_변경로그
```

### 체크리스트

- [ ] Google Sheets 파일 생성
- [ ] `00_대시보드` 탭 생성
- [ ] `01_작업목록` 탭 생성
- [ ] `02_MVP_7일구조` 탭 생성
- [ ] `03_자원` 탭 생성
- [ ] `04_캐릭터` 탭 생성
- [ ] `05_이벤트` 탭 생성
- [ ] `06_선택지` 탭 생성
- [ ] `07_밸런싱` 탭 생성
- [ ] `08_UI화면목록` 탭 생성
- [ ] `99_변경로그` 탭 생성
- [ ] `task-list-template.csv` 반영
- [ ] `resources-template.csv` 반영
- [ ] `mvp-7days-template.csv` 반영
- [ ] 실제 Sheets 링크를 GitHub 문서에 기록

관련 기준 문서:

```text
docs/data-design/GOOGLE_SHEETS_STRUCTURE.md
docs/data-design/templates/task-list-template.csv
docs/data-design/templates/resources-template.csv
docs/data-design/templates/mvp-7days-template.csv
```

---

## 3. Figma 실제 생성

### 생성할 Figma 파일명

```text
red-ledger-game_적혈의장부_UIUX
```

### 생성할 페이지

```text
00_Cover
01_Project_Brief
02_User_Flow
03_Wireframe_Mobile
04_Wireframe_PC
05_Game_Screens
06_Components
07_Visual_References
99_Archive
```

### 체크리스트

- [ ] Figma 파일 생성
- [ ] `00_Cover` 페이지 생성
- [ ] `01_Project_Brief` 페이지 생성
- [ ] `02_User_Flow` 페이지 생성
- [ ] `03_Wireframe_Mobile` 페이지 생성
- [ ] `04_Wireframe_PC` 페이지 생성
- [ ] `05_Game_Screens` 페이지 생성
- [ ] `06_Components` 페이지 생성
- [ ] `07_Visual_References` 페이지 생성
- [ ] `99_Archive` 페이지 생성
- [ ] `SCR-001` ~ `SCR-010` 화면ID 기준 반영
- [ ] Figma 화면ID와 Google Sheets `08_UI화면목록` 연결
- [ ] 실제 Figma 링크를 GitHub 문서에 기록

관련 기준 문서:

```text
docs/ui-ux/FIGMA_STRUCTURE.md
docs/ui-ux/SCREEN_LIST.md
docs/ui-ux/WIREFRAME_NOTES.md
```

---

## 4. Google Calendar 실제 생성

### 생성할 캘린더명

```text
red-ledger-game_적혈의장부_일정
```

### 체크리스트

- [ ] Google Calendar 생성
- [ ] 일정 분류 기준 확인: 전처리, 기획, 데이터, UIUX, 개발, 검토, 마감
- [ ] `[분류] 작업명` 제목 규칙 적용
- [ ] 전처리 주요 일정 등록
- [ ] MVP 기획 단계 일정 등록
- [ ] 주 1회 프로젝트 상태 점검 일정 등록
- [ ] 주 1회 작업 로그 정리 일정 등록
- [ ] 실제 Calendar 링크 또는 캘린더명 GitHub 문서에 기록

관련 기준 문서:

```text
docs/operations/CALENDAR_STRUCTURE.md
docs/operations/templates/calendar-event-template.md
```

---

## 5. Gmail 실제 설정

### 생성할 기본 라벨

```text
red-ledger-game
```

### 권장 하위 라벨

```text
red-ledger-game/GitHub
red-ledger-game/Drive
red-ledger-game/Sheets
red-ledger-game/Figma
red-ledger-game/Calendar
red-ledger-game/공유
red-ledger-game/검토
red-ledger-game/보관
```

### 체크리스트

- [ ] 기본 라벨 `red-ledger-game` 생성
- [ ] `red-ledger-game/GitHub` 라벨 생성
- [ ] `red-ledger-game/Drive` 라벨 생성
- [ ] `red-ledger-game/Sheets` 라벨 생성
- [ ] `red-ledger-game/Figma` 라벨 생성
- [ ] `red-ledger-game/Calendar` 라벨 생성
- [ ] `red-ledger-game/공유` 라벨 생성
- [ ] `red-ledger-game/검토` 라벨 생성
- [ ] `red-ledger-game/보관` 라벨 생성
- [ ] GitHub 알림 필터 연결
- [ ] Drive 알림 필터 연결
- [ ] Sheets 알림 필터 연결
- [ ] Figma 알림 필터 연결
- [ ] Calendar 알림 필터 연결

관련 기준 문서:

```text
docs/operations/GMAIL_STRUCTURE.md
docs/operations/templates/gmail-share-template.md
```

---

## 6. 실제 도구 연결 완료 조건

다음 항목이 완료되면 전처리 단계의 실제 도구 연결이 완료된 것으로 봅니다.

- [ ] Google Drive 실제 폴더 생성 완료
- [ ] Google Sheets 실제 파일 생성 완료
- [ ] Figma 실제 파일 생성 완료
- [ ] Google Calendar 실제 캘린더 생성 완료
- [ ] Gmail 실제 라벨 생성 완료
- [ ] 각 도구의 실제 링크 또는 식별명을 GitHub 문서에 기록
- [ ] `CHECKLIST.md`의 실제 생성 확인 항목 갱신
- [ ] `WORK_LOG.md`에 실제 도구 생성 완료 기록

## 주의 사항

- 비밀번호, API 키, Personal Access Token, 복구 코드, 비밀키는 어느 도구에도 평문으로 저장하지 않습니다.
- 실제 링크를 기록할 때는 접근 권한을 확인합니다.
- 외부 공유가 필요한 경우 최소 권한 원칙을 적용합니다.
