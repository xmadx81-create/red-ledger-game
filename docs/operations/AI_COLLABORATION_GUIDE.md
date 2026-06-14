# AI 협업 인수인계 가이드

이 문서는 ChatGPT, Claude AI, 기타 AI 도구 또는 새 대화 세션에서 `red-ledger-game` 프로젝트를 이어받기 위한 기준 문서입니다.

## 프로젝트 한 줄 요약

`red-ledger-game`은 헌혈센터/혈연센터를 가장한 뱀파이어 가문의 비밀 혈액 수급망을 운영하는 다크 행정 누아르 운영 시뮬레이션 게임입니다.

## 현재 프로젝트 단계

현재 단계는 **전처리 단계**입니다.

전처리 단계의 목적은 본격 개발 이전에 다음 항목을 확정하는 것입니다.

- 저장소 구조
- 문서 저장 규칙
- 작업 로그 방식
- 협업 도구 연동 방식
- 데이터 관리 방식
- 새 세션 인수인계 방식

## 기준 저장소

- GitHub 계정: `xmadx81-create`
- 저장소: `xmadx81-create/red-ledger-game`
- 기본 브랜치: `main`
- 저장소 공개 범위: Private

## 새 AI 세션이 가장 먼저 확인할 문서

새 세션에서는 반드시 다음 순서로 확인합니다.

1. `docs/preprocessing/README.md`
2. `docs/preprocessing/CHECKLIST.md`
3. `docs/preprocessing/WORK_LOG.md`
4. `docs/PROJECT_STRUCTURE.md`
5. `docs/operations/GITHUB_WORKFLOW.md`
6. `docs/operations/DOCUMENT_RULES.md`
7. `docs/operations/AI_COLLABORATION_GUIDE.md`

## 도구별 역할

| 도구 | 역할 |
|---|---|
| GitHub | 확정 문서, 작업 로그, 코드, 기준 저장소 |
| Google Drive | 원본 문서, 이미지, PDF, 공유용 자료 |
| Google Sheets | 작업표, 캐릭터/자원/이벤트/선택지 데이터 |
| Figma | UI/UX 설계, 와이어프레임, 화면 흐름 |
| Google Calendar | 프로젝트 일정, 마감일, 회의 일정 |
| Gmail | 알림, 공유, 외부 전달 기록 |

## 작업 원칙

- 작업을 시작하기 전 현재 단계와 체크리스트를 확인합니다.
- 새 문서를 만들기 전 기존 문서와 중복되는지 확인합니다.
- 중요한 결정은 `WORK_LOG.md`에 남깁니다.
- 도구별 역할을 혼동하지 않습니다.
- GitHub는 최종 기준으로 사용합니다.
- Google Drive와 Sheets는 편집/표 관리용으로 사용합니다.
- Figma는 화면 구조를 시각화하는 데 사용합니다.

## AI가 작업할 때 지켜야 할 것

1. 추측으로 저장소 구조를 바꾸지 않습니다.
2. 문서 작성 후 관련 체크리스트 또는 작업 로그를 갱신합니다.
3. 기존 문서를 삭제하지 않습니다.
4. 중요한 변경은 작은 단위로 나누어 커밋합니다.
5. 사용자가 승인하지 않은 대규모 구조 변경은 하지 않습니다.
6. 민감한 키, 토큰, 비밀번호는 절대 문서에 저장하지 않습니다.
7. 새 세션에서 이어받기 쉽도록 변경 이유를 남깁니다.

## 현재 확정된 게임 기획 기준

- 장르: 경영 시뮬레이션 + 선택형 스토리 + 조직관리
- 톤: 다크 행정 누아르
- 표면 조직: 백십자재단 산하 혈연센터
- 이면 조직: 카르테인 가문 혈액관리국
- 1차 MVP: 7일 운영 구조

## 주요 자원 후보

- 혈액 재고
- 가문 자금
- 가문 위신
- 인간 신뢰
- 언론 노출
- 조직 불안
- 보안 등급
- 가문 만족도

## 주요 인물 후보

- 서윤재 실장: 총괄 관리자
- 김도현 과장: 야간 의사
- 박세연 팀장: 물류 협력자
- 정하린 기자: 외부 위협
- 엘리엇 카르테인: 가문 원로

## 다음 작업 후보

1. Google Drive 저장 위치 확정
2. Google Sheets 관리표 구조 설계
3. MVP 7일 운영 구조 문서화
4. 핵심 자원 시스템 문서화
5. Figma 화면 설계 기준 작성

## Claude AI 또는 외부 AI에게 전달할 요약문

아래 문단은 다른 AI에게 프로젝트 상태를 전달할 때 복사해서 사용할 수 있습니다.

```text
현재 `red-ledger-game` 프로젝트는 GitHub 저장소 `xmadx81-create/red-ledger-game`에서 관리 중이며, 전처리 단계에 있다. 이 프로젝트는 헌혈센터/혈연센터를 가장한 뱀파이어 가문의 비밀 혈액 수급망을 운영하는 다크 행정 누아르 운영 시뮬레이션 게임이다. 1차 MVP는 7일 운영 구조를 기준으로 한다. GitHub는 최종 기준 저장소로 사용하고, Google Drive는 원본/공유 자료, Google Sheets는 데이터 표, Figma는 UI/UX, Google Calendar는 일정, Gmail은 알림/전달 기록으로 역할을 분리한다. 새 세션에서는 `docs/preprocessing/README.md`, `CHECKLIST.md`, `WORK_LOG.md`, `docs/PROJECT_STRUCTURE.md`, `docs/operations/GITHUB_WORKFLOW.md`, `DOCUMENT_RULES.md`, `AI_COLLABORATION_GUIDE.md`를 먼저 확인해야 한다.
```
