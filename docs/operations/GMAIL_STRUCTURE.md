# Gmail 알림 및 공유 기준

이 문서는 `red-ledger-game` 프로젝트의 Gmail 운영 기준을 정의합니다.

## 목적

Gmail은 프로젝트 관련 알림, 공유, 전달, 외부 협업 기록을 관리하는 도구입니다.

GitHub가 기준 문서와 작업 이력을 담당하고, Google Calendar가 일정 리마인드를 담당한다면, Gmail은 외부 전달과 알림 수신 기록을 담당합니다.

## 권장 Gmail 라벨

```text
red-ledger-game
```

하위 라벨을 사용할 경우 다음 구조를 권장합니다.

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

## 라벨별 역할

| 라벨 | 역할 |
|---|---|
| `red-ledger-game/GitHub` | GitHub 저장소, 이슈, PR, 커밋 알림 |
| `red-ledger-game/Drive` | Google Drive 공유 문서 알림 |
| `red-ledger-game/Sheets` | Google Sheets 공유/변경 알림 |
| `red-ledger-game/Figma` | Figma 파일 공유, 댓글, 디자인 검토 알림 |
| `red-ledger-game/Calendar` | 일정 초대, 리마인드, 회의 알림 |
| `red-ledger-game/공유` | 외부 AI, 협업자, 검토자에게 전달한 자료 |
| `red-ledger-game/검토` | 확인이 필요한 메일 |
| `red-ledger-game/보관` | 완료되었지만 보존할 메일 |

## 메일 제목 규칙

프로젝트 관련 메일을 직접 보낼 때는 다음 형식을 권장합니다.

```text
[red-ledger-game] 분류 - 제목
```

예시:

```text
[red-ledger-game] 공유 - 전처리 단계 기준 문서 전달
[red-ledger-game] 검토 - MVP 7일 운영 구조 확인 요청
[red-ledger-game] Figma - 메인 운영 화면 와이어프레임 공유
[red-ledger-game] Sheets - 자원표 1차 구조 검토 요청
```

## 공유 메일 기본 템플릿

```text
제목: [red-ledger-game] 공유 - 자료명

안녕하세요.

red-ledger-game 프로젝트 관련 자료를 공유드립니다.

## 공유 목적

## 확인할 자료

## 요청 사항

## 관련 링크
- GitHub:
- Google Drive:
- Google Sheets:
- Figma:

감사합니다.
```

## 검토 요청 메일 템플릿

```text
제목: [red-ledger-game] 검토 - 검토 대상

안녕하세요.

아래 항목에 대한 검토를 요청드립니다.

## 검토 대상

## 검토 기준

## 중점 확인 사항

## 마감 또는 희망 회신일

## 관련 링크
- GitHub:
- Google Drive:
- Google Sheets:
- Figma:

감사합니다.
```

## 알림 수신 기준

| 알림 종류 | 권장 처리 |
|---|---|
| GitHub 커밋/이슈/PR 알림 | `red-ledger-game/GitHub` 라벨 적용 |
| Drive 공유 문서 알림 | `red-ledger-game/Drive` 라벨 적용 |
| Sheets 공유/댓글 알림 | `red-ledger-game/Sheets` 라벨 적용 |
| Figma 댓글/공유 알림 | `red-ledger-game/Figma` 라벨 적용 |
| Calendar 일정 알림 | `red-ledger-game/Calendar` 라벨 적용 |
| 외부 협업자 회신 | `red-ledger-game/검토` 라벨 적용 |

## Gmail과 다른 도구의 연결 기준

| 항목 | Gmail | 연결 도구 |
|---|---|---|
| GitHub 알림 | 커밋/이슈/PR 수신 | GitHub |
| Drive 공유 | 파일 공유 알림 수신 | Google Drive |
| Sheets 변경 | 댓글/공유 알림 수신 | Google Sheets |
| Figma 검토 | 댓글/공유 알림 수신 | Figma |
| 일정 초대 | 회의/마감 알림 수신 | Google Calendar |
| 외부 전달 | 자료 공유 기록 보관 | 전체 도구 |

## 새 세션에서 Gmail을 사용하는 방식

1. GitHub의 `docs/operations/GMAIL_STRUCTURE.md`를 확인합니다.
2. Gmail에서 `red-ledger-game` 라벨 또는 하위 라벨이 있는지 확인합니다.
3. 프로젝트 관련 메일은 라벨을 기준으로 검색합니다.
4. 외부 공유한 자료는 GitHub `WORK_LOG.md` 또는 관련 문서에도 요약 기록합니다.
5. 중요한 검토 요청이나 회신은 Google Sheets `01_작업목록` 또는 Calendar 일정과 연결합니다.

## 보안 원칙

Gmail에도 다음 정보는 보내거나 저장하지 않습니다.

- 비밀번호
- API 키
- Personal Access Token
- GitHub 비밀키
- 개인 인증 정보
- 복구 코드

민감 정보가 실수로 발송되었을 경우 즉시 폐기하고, 해당 키나 토큰은 재발급합니다.

## 현재 상태

- Gmail 실제 라벨 생성은 아직 확인되지 않았습니다.
- 본 문서는 Gmail 라벨, 알림, 공유, 검토 요청 기준을 만들기 위한 기준 문서입니다.
