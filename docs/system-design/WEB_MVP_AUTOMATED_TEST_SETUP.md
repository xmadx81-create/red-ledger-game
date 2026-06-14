# Web MVP 자동 검증 설정

이 문서는 `src/web-mvp`의 기본 데이터/흐름 검증 자동화 설정을 기록합니다.

## 설정 일자

```text
2026-06-15
```

## 목적

웹 MVP 코드가 변경될 때 다음 오류를 빠르게 확인합니다.

```text
JSON 데이터 수량 오류
이벤트ID/선택지ID 연결 오류
Day 1~Day 7 이벤트 누락
선택지 누락
알 수 없는 자원 key 참조
기본 루트 시뮬레이션 실패
```

## 생성한 테스트 파일

```text
src/web-mvp/tests/smoke-test.mjs
src/web-mvp/tests/README.md
```

## 생성한 GitHub Actions 워크플로우

```text
.github/workflows/web-mvp-smoke-test.yml
```

## 워크플로우 이름

```text
Web MVP Smoke Test
```

## 실행 조건

```text
src/web-mvp/** 변경 시
.github/workflows/web-mvp-smoke-test.yml 변경 시
pull_request 발생 시
수동 실행 workflow_dispatch
```

## 실행 명령

```bash
node src/web-mvp/tests/smoke-test.mjs
```

## 테스트 검증 항목

| 항목 | 기준 |
|---|---|
| 자원 수 | 9개 |
| 캐릭터 수 | 5명 |
| 이벤트 수 | 7개 |
| 선택지 수 | 23개 |
| Day 이벤트 | Day 1~Day 7 각각 1개 |
| 선택지 연결 | 모든 선택지가 실제 이벤트ID 참조 |
| Day별 선택지 | 각 Day 최소 3개 |
| 선택지 자원 key | 실제 자원 key만 참조 |
| 기본 루트 | 중용/가문/인간 우선 흐름 시뮬레이션 |

## 현재 상태

```text
테스트 스크립트 생성 완료
테스트 README 생성 완료
GitHub Actions 워크플로우 생성 완료
워크플로우 파일 저장 확인 완료
```

## 주의 사항

- 이 검증은 브라우저 UI 클릭 테스트가 아닙니다.
- 현재 단계에서는 데이터 연결과 기본 로직 흐름을 검증합니다.
- 실제 화면 클릭 테스트는 브라우저 또는 Playwright 기반 테스트가 필요합니다.

## 다음 작업

```text
GitHub Pages 또는 미리보기 배포 설정 검토
브라우저 UI 클릭 테스트 추가 검토
모바일 화면 1차 조정
```
