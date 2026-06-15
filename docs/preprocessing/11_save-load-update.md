# 2026-06-16 — 저장/불러오기 기능 추가 기록

## 작업자

ChatGPT + 백무결

## 작업 구분

MVP 플레이 상태 저장 / localStorage 자동 저장 기능 추가

## 작업 내용

- `src/storage.ts`를 생성했다.
- 브라우저 `localStorage`에 게임 상태를 저장하도록 구성했다.
- 저장 키는 아래 값을 사용한다.

```text
red-ledger:mvp-save:v1
```

- `loadGameState` 함수를 추가했다.
  - 저장 데이터가 없으면 초기 상태를 반환한다.
  - 저장 데이터가 손상되었거나 구조가 맞지 않으면 초기 상태로 안전 복구한다.
- `saveGameState` 함수를 추가했다.
  - 게임 상태가 바뀔 때마다 저장한다.
- `clearGameState` 함수를 추가했다.
  - 새 운영 시작 또는 다시 운영하기 시 저장 데이터를 삭제한다.
- `src/App.tsx`에 저장 로직을 연결했다.
- `src/styles.css`에 자동 저장 상태 UI와 초기화 버튼 스타일을 추가했다.
- `README.md`, `docs/development/00_local-run.md`, `docs/development/01_test-checklist.md`를 갱신했다.

## 수정 파일

```text
src/storage.ts
src/App.tsx
src/styles.css
README.md
docs/development/00_local-run.md
docs/development/01_test-checklist.md
```

## 결과

- 선택지를 클릭하면 현재 진행 상태가 자동 저장된다.
- 새로고침해도 Day, 자원, 작업 기록이 유지된다.
- 새 운영 시작 버튼을 누르면 저장 데이터를 삭제하고 Day 1 초기 상태로 돌아간다.

## 테스트 기준

```text
1. Day 1에서 선택지를 클릭한다.
2. Day와 자원이 변하는지 확인한다.
3. 브라우저를 새로고침한다.
4. 변경된 상태가 유지되는지 확인한다.
5. 새 운영 시작을 클릭한다.
6. Day 1 초기 상태로 복귀하는지 확인한다.
```

## 다음 조치

1. 로컬 또는 GitHub Actions 빌드 결과 확인
2. 이벤트 발생 조건 구조화
3. 후보E 카드형 UI 정교화
4. 카드 도감 시스템 설계
