# 적혈의 장부 — 연동 앱 준비 체크리스트

작성일: 2026-06-16

## 전체 진행 현황

| 순서 | 앱 | 목적 | 상태 | 다음 조치 |
|---:|---|---|---|---|
| 0 | 전처리 저장소 | 기록/체크리스트 저장 구조 확정 | 완료 | 이후 모든 단계 기록 유지 |
| 1 | GitHub | 코드, 문서, 작업로그의 기준 저장소 | 완료 | Issue #1에서 추적 |
| 2 | Google Drive | 기획서/자료/이미지/외부문서 보관 | 완료 | 폴더별 자료 적재 |
| 3 | Google Sheets | 밸런스표, 이벤트표, 작업현황표 관리 | 완료 | Resources/Events/Characters 데이터 입력 |
| 4 | Figma | 게임 UI/UX 화면 설계 | 완료 | 화면 구체화 및 프로토타입 연결 |
| 5 | Google Calendar | 개발 일정, 테스트 일정, 마일스톤 관리 | 부분 완료 | 등록된 4개 일정 기준으로 진행, 장기 스프린트는 수동 등록 필요 |
| 6 | Gmail | 협업자 공유, 개발 요청, 회의록 전달 | 완료 | 임시보관함 템플릿을 복사해 사용 |

---

## 0. 전처리 저장소

| 체크 | 항목 | 세부 내용 |
|---|---|---|
| [x] | 전처리 단계 선언 | 게임 제작 전 연결 환경 준비 단계로 설정 |
| [x] | 저장 기준 제안 | GitHub `docs/preprocessing/` |
| [x] | 기본 파일 구조 작성 | 인덱스, 체크리스트, 작업로그, 저장맵, 결정로그, 다음작업 |
| [x] | GitHub 저장소 접근 확인 | `xmadx81-create/red-ledger-game` 확인 |
| [x] | GitHub에 파일 업로드 | 전처리 문서 6개 및 CSV 업로드 완료 |
| [x] | Google Drive 보조 폴더 생성 | `게임제작/Red_Ledger/00_Preprocessing` 생성 완료 |

## 1. GitHub 준비

| 체크 | 항목 | 세부 내용 |
|---|---|---|
| [x] | GitHub 앱 연결 확인 | 설치 계정 `xmadx81-create` 확인 |
| [x] | 저장소 접근 확인 | `xmadx81-create/red-ledger-game` 확인 |
| [x] | 저장소명 확정 | `red-ledger-game` |
| [x] | 기본 브랜치 확인 | 기본 브랜치에 파일 생성 성공 |
| [x] | `docs/preprocessing/` 폴더 생성 | 전처리 문서 저장 완료 |
| [x] | 첫 커밋 기록 생성 | 파일별 커밋으로 기록 완료 |
| [x] | 전처리 이슈 생성 | Issue #1 `[PRE-0] 제작 환경 전처리` |
| [x] | 라벨 생성/적용 | `preprocessing`, `docs`, `integration` 적용 완료 |

## 2. Google Drive 준비

| 체크 | 항목 | 세부 내용 |
|---|---|---|
| [x] | 최상위 폴더 생성 | `게임제작` |
| [x] | 프로젝트 폴더 생성 | `Red_Ledger` |
| [x] | 전처리 폴더 생성 | `00_Preprocessing` |
| [x] | 기획 폴더 생성 | `01_Planning` |
| [x] | 데이터 폴더 생성 | `02_Data` |
| [x] | UI 폴더 생성 | `03_UI_Figma` |
| [x] | 회의/공유 폴더 생성 | `04_Meetings_Sharing` |
| [x] | 산출물 폴더 생성 | `05_Build_Release` |
| [x] | 전처리 백업 업로드 | `red-ledger-preprocessing-package.zip` |

## 3. Google Sheets 준비

| 체크 | 항목 | 세부 내용 |
|---|---|---|
| [x] | 마스터 시트 생성 | `Red_Ledger_Development_Master` |
| [x] | 체크리스트 탭 | `Checklist` |
| [x] | 작업로그 탭 | `Work_Log` |
| [x] | 게임자원 탭 | `Resources` |
| [x] | 이벤트 탭 | `Events` |
| [x] | 캐릭터 탭 | `Characters` |
| [x] | 엔딩 탭 | `Endings` |
| [x] | 버그리포트 탭 | `Bug_Report` |

## 4. Figma 준비

| 체크 | 항목 | 세부 내용 |
|---|---|---|
| [x] | Figma 파일 생성 | `Red_Ledger_UI_MVP` |
| [x] | 페이지 구성 | Cover, Flow, Components, Screens, Prototype |
| [x] | 모바일 기준 화면 | Galaxy S25 기준 390×844 프레임 생성 |
| [x] | 핵심 화면 설계 | Dashboard, Daily Operation, Event Decision, Settlement, Ending |
| [x] | 컴포넌트 작성 | Primary Button, Resource Card, Decision Modal 초안 |
| [x] | 링크 등록 | `https://www.figma.com/design/66jy5pA53glrYSspUTB6bH` |

## 5. Google Calendar 준비

| 체크 | 항목 | 세부 내용 |
|---|---|---|
| [x] | 전처리 점검 일정 등록 | `Red Ledger - Preprocessing Complete Check`, 2026-06-16 10:00 |
| [x] | MVP 기획 확정 일정 등록 | `Red Ledger - MVP Planning Lock`, 2026-06-17 10:00 |
| [x] | 데이터/시스템 설계 일정 등록 | `Red Ledger - Data & System Design`, 2026-06-18 10:00 |
| [x] | UI 검토 일정 등록 | `RL Project - UI Review`, 2026-06-19 10:00 |
| [ ] | 장기 MVP 스프린트 일정 등록 | 도구 안전검사 차단으로 수동 등록 필요 |
| [ ] | 테스트/배포 후보일 등록 | 추후 일정 확정 후 등록 |

## 6. Gmail 준비

| 체크 | 항목 | 세부 내용 |
|---|---|---|
| [x] | 공유 메일 템플릿 작성 | `[RL Project] 개발 공유 템플릿` 임시보관함 생성 |
| [x] | 작업 요청 템플릿 작성 | `[RL Project] 기능 요청 템플릿` 임시보관함 생성 |
| [x] | 버그 리포트 템플릿 작성 | `[RL Project] 버그 리포트 템플릿` 임시보관함 생성 |
| [x] | 회의록 전달 템플릿 작성 | `[RL Project] 회의록 전달 템플릿` 임시보관함 생성 |
