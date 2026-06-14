# 문서 저장 규칙

이 문서는 `red-ledger-game` 프로젝트에서 문서를 어디에 저장하고 어떻게 관리할지 정리합니다.

## 기본 원칙

- GitHub는 확정 기준과 이력 관리용 저장소입니다.
- Google Drive는 원본 파일, 대용량 자료, 공유용 문서 보관소로 사용합니다.
- Google Sheets는 표 형식의 관리 데이터와 밸런싱 데이터를 관리합니다.
- Figma는 화면 설계와 UI 시안을 관리합니다.
- Google Calendar는 일정과 마감일을 관리합니다.
- Gmail은 알림, 전달, 외부 공유 기록을 관리합니다.

## GitHub에 저장할 문서

GitHub에는 프로젝트 기준이 되는 문서를 저장합니다.

| 문서 유형 | 저장 위치 |
|---|---|
| 전처리 기록 | `docs/preprocessing/` |
| 프로젝트 구조 | `docs/PROJECT_STRUCTURE.md` |
| 게임 기획 | `docs/game-design/` |
| 시스템 설계 | `docs/system-design/` |
| 데이터 설계 | `docs/data-design/` |
| UI/UX 기준 | `docs/ui-ux/` |
| 운영/협업 규칙 | `docs/operations/` |

## Google Drive에 저장할 자료

Google Drive에는 편집이 잦거나 파일 형태로 관리해야 하는 자료를 저장합니다.

예상 저장 대상:

- 회의용 문서
- 공유용 기획서
- 이미지 원본
- PDF 자료
- 외부 참고 문서
- 백업 파일
- 내보내기 파일

## Google Sheets에 저장할 자료

Google Sheets에는 표 형태로 관리해야 하는 데이터를 둡니다.

예상 시트:

- 작업 목록
- 캐릭터 목록
- 자원 목록
- 이벤트 목록
- 선택지 목록
- 7일 MVP 진행표
- 밸런싱 수치표

## Figma에 저장할 자료

Figma에는 화면과 시각 구조를 둡니다.

예상 항목:

- 메인 화면 와이어프레임
- 일차 운영 화면
- 이벤트/선택지 화면
- 캐릭터/조직 관리 화면
- 자원 상태 표시 UI
- 모바일/PC 레이아웃

## 문서 이름 규칙

문서 파일명은 가급적 영어 소문자와 하이픈을 사용합니다.

예시:

```text
mvp-7days-plan.md
resource-system.md
event-table-guide.md
main-screen-wireframe.md
```

한글 제목은 문서 내부의 제목으로 사용합니다.

## 새 문서 작성 절차

1. 해당 문서가 들어갈 폴더를 확인합니다.
2. 기존 문서와 중복되는지 확인합니다.
3. 새 문서를 작성합니다.
4. 관련 체크리스트 또는 작업 로그를 갱신합니다.
5. 다른 도구와 연결되는 문서라면 링크 또는 참조 위치를 남깁니다.

## 새 세션에서 문서를 찾는 기준

새 세션에서는 다음 순서로 프로젝트 상태를 파악합니다.

1. `docs/preprocessing/CHECKLIST.md`
2. `docs/preprocessing/WORK_LOG.md`
3. `docs/PROJECT_STRUCTURE.md`
4. `docs/operations/DOCUMENT_RULES.md`
5. 현재 작업 주제와 관련된 폴더

## 역할 분리 기준

- 최종 기준: GitHub
- 편집/공유 원본: Google Drive
- 표 데이터: Google Sheets
- 화면 설계: Figma
- 일정: Google Calendar
- 메일 전달/알림: Gmail

이 역할 분리를 유지하면 새 세션에서도 어느 자료를 어디서 찾아야 하는지 쉽게 판단할 수 있습니다.
