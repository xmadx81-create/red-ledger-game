# GitHub 작업 규칙

이 문서는 `red-ledger-game` 프로젝트의 GitHub 작업 방식을 정리합니다.

## 목적

GitHub는 이 프로젝트의 기준 저장소입니다. 새 대화 세션, 다른 AI 도구, 다른 작업자가 들어와도 같은 기준으로 이어서 작업할 수 있도록 이 문서를 기준으로 삼습니다.

## 기본 원칙

- `main` 브랜치는 항상 안정적인 기준 상태로 유지합니다.
- 문서 변경은 작은 단위로 자주 커밋합니다.
- 중요한 결정은 코드보다 먼저 문서에 기록합니다.
- 작업 전에는 관련 문서를 먼저 확인합니다.
- 작업 후에는 `docs/preprocessing/WORK_LOG.md` 또는 관련 운영 문서에 변경 사항을 기록합니다.

## 브랜치 규칙

초기 전처리 단계에서는 `main`에 직접 문서 작업을 반영할 수 있습니다.

본격 개발 단계부터는 다음 형식을 권장합니다.

```text
feature/기능명
fix/수정명
docs/문서명
data/데이터명
ui/화면명
```

예시:

```text
docs/mvp-7days-plan
feature/day-flow-system
ui/main-dashboard-wireframe
data/event-table-v1
```

## 커밋 메시지 규칙

커밋 메시지는 다음 형식을 사용합니다.

```text
분류: 작업 내용
```

권장 분류:

| 분류 | 의미 |
|---|---|
| `docs` | 문서 작성/수정 |
| `assets` | 이미지/레퍼런스 자료 추가 |
| `data` | 데이터 구조/시트/JSON 관련 변경 |
| `ui` | UI/UX 설계 또는 화면 관련 변경 |
| `feature` | 기능 추가 |
| `fix` | 오류 수정 |
| `refactor` | 구조 개선 |
| `chore` | 기타 정리 작업 |

예시:

```text
docs: add preprocessing checklist
docs: update project structure guide
data: add event table draft
ui: add main screen wireframe notes
```

## 이슈 규칙

이슈는 해야 할 일을 명확히 쪼개기 위해 사용합니다.

이슈 제목 예시:

```text
[Docs] MVP 7일 운영 구조 정리
[Data] 자원 상태값 표 설계
[UI] 메인 운영 화면 와이어프레임 작성
[System] 하루 진행 루프 규칙 정리
```

이슈 본문에는 최소한 다음 항목을 적습니다.

```text
## 목적

## 작업 범위

## 완료 조건

## 관련 문서
```

## Pull Request 규칙

본격 개발 단계에서 PR을 사용할 경우 다음 항목을 포함합니다.

```text
## 변경 내용

## 확인한 사항

## 관련 이슈

## 다음 작업
```

## 새 세션 시작 시 확인 순서

새 ChatGPT 세션, Claude AI 세션, 또는 다른 협업자가 이어받을 때는 다음 순서로 확인합니다.

1. `docs/preprocessing/README.md`
2. `docs/preprocessing/CHECKLIST.md`
3. `docs/preprocessing/WORK_LOG.md`
4. `docs/PROJECT_STRUCTURE.md`
5. `docs/operations/AI_COLLABORATION_GUIDE.md`
6. 현재 작업과 관련된 세부 폴더의 `README.md`

## 현재 단계

현재 프로젝트는 전처리 단계입니다. 따라서 코드 구현보다 문서 구조, 도구 연동, 데이터 설계 기준, 협업 기준 확정을 우선합니다.
