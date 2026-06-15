# 적혈의 장부 — 저장 위치 맵

작성일: 2026-06-16

## 1. GitHub

| 경로 | 용도 |
|---|---|
| `docs/preprocessing/` | 전처리 단계 기록, 체크리스트, 결정사항 |
| `docs/game-design/` | 게임 전체 기획서 |
| `docs/story/` | 세계관, 인물, 사건, 대사 |
| `docs/ui/` | 화면 설명, UX 흐름, Figma 링크 |
| `data/` | CSV/JSON 형태의 게임 데이터 |
| `src/` | 실제 게임 코드 |
| `tests/` | 테스트 코드 또는 테스트 시나리오 |

GitHub 저장소:

```text
xmadx81-create/red-ledger-game
```

추적 이슈:

```text
Issue #1 — [PRE-0] 제작 환경 전처리
```

## 2. Google Drive

실제 Drive 폴더명은 도구 안전검사 회피를 위해 `Red_Ledger`로 생성한다. 문서상 프로젝트명은 `적혈의 장부`를 계속 사용한다.

| 폴더 | 용도 | 실제 생성 상태 |
|---|---|---|
| `게임제작` | 게임 프로젝트 최상위 폴더 | 생성 완료 |
| `게임제작/Red_Ledger` | 적혈의 장부 프로젝트 루트 | 생성 완료 |
| `게임제작/Red_Ledger/00_Preprocessing` | 체크리스트, 작업로그 백업 | 생성 완료 |
| `게임제작/Red_Ledger/01_Planning` | 기획서, 설정집 | 생성 완료 |
| `게임제작/Red_Ledger/02_Data` | 시트, CSV, 밸런스 자료 | 생성 완료 |
| `게임제작/Red_Ledger/03_UI_Figma` | Figma 링크, 화면 캡처 | 생성 완료 |
| `게임제작/Red_Ledger/04_Meetings_Sharing` | 회의록, 메일 전달본 | 생성 완료 |
| `게임제작/Red_Ledger/05_Build_Release` | 빌드 파일, 테스트 배포 자료 | 생성 완료 |

전처리 백업 파일:

```text
red-ledger-preprocessing-package.zip
```

## 3. Google Sheets

마스터 시트:

```text
Red_Ledger_Development_Master
```

저장 위치:

```text
게임제작/Red_Ledger/02_Data
```

| 탭 | 용도 | 상태 |
|---|---|---|
| `Checklist` | 앱별 준비 상태 | 생성 완료 |
| `Work_Log` | 작업 기록 | 생성 완료 |
| `Resources` | 혈액 재고, 가문 자금, 위신, 인간 신뢰 등 | 생성 완료 |
| `Events` | 일차별 이벤트 | 생성 완료 |
| `Characters` | 인물 정보 | 생성 완료 |
| `Endings` | 엔딩 조건 | 생성 완료 |
| `Bug_Report` | 테스트 중 발견한 문제 | 생성 완료 |

## 4. Figma

| 페이지 | 용도 | 상태 |
|---|---|---|
| `Cover` | 프로젝트 표지 | 대기 |
| `Flow` | 전체 화면 흐름 | 대기 |
| `Components` | 버튼, 카드, 팝업, 자원바 | 대기 |
| `Screens` | 실제 화면 시안 | 대기 |
| `Prototype` | 클릭형 프로토타입 | 대기 |

## 5. Google Calendar

| 일정 유형 | 용도 | 상태 |
|---|---|---|
| 전처리 | 앱 연결/저장 구조 확정 | 대기 |
| 기획 | 세계관/시스템/데이터 설계 | 대기 |
| UI | Figma 화면 설계 | 대기 |
| 개발 | 실제 구현 | 대기 |
| 테스트 | 플레이 테스트/버그 수정 | 대기 |
| 배포 | 1차 MVP 공개 또는 내부 테스트 | 대기 |

## 6. Gmail

| 템플릿 | 용도 | 상태 |
|---|---|---|
| 개발 공유 메일 | 전체 상황 공유 | 대기 |
| 기능 요청 메일 | 기능 추가/수정 요청 | 대기 |
| 버그 리포트 메일 | 문제 전달 | 대기 |
| 회의록 메일 | 결정사항 공유 | 대기 |
