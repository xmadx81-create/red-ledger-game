# 2026-06-16 — 이벤트 데이터 구조화 기록

## 작업자

ChatGPT + 백무결

## 작업 구분

MVP 데이터 구조 정리 / 이벤트 효과 구조화

## 작업 내용

기존 상태:

- `data/events.json`에는 `choiceA`, `effectA`, `choiceB`, `effectB`가 문자열 형태로 들어 있었다.
- `src/data.ts`에는 같은 이벤트 데이터가 다시 하드코딩되어 있었다.
- 따라서 이벤트 데이터 원본이 `data/events.json`과 `src/data.ts`로 중복되는 문제가 있었다.

수정 내용:

- `data/events.json`을 코드 연동 기준 데이터로 정리했다.
- 각 이벤트에 `choices` 객체를 추가했다.
- `choices.A.effects`, `choices.B.effects` 배열을 추가했다.
- 각 effect는 아래 구조를 따른다.

```json
{
  "resourceId": "RES_TRUST",
  "amount": 8
}
```

- `src/data.ts`에서 하드코딩된 이벤트 배열을 제거했다.
- `src/data.ts`는 이제 `data/events.json`을 직접 import한다.

## 수정 파일

```text
data/events.json
src/data.ts
docs/game-design/06_data-schema.md
data/README.md
```

## 결과

- 이벤트 데이터 원본이 `data/events.json`으로 일원화되었다.
- 게임 코드는 JSON을 직접 읽어 선택지 효과를 계산한다.
- `events.csv`는 사람 검토용 문자열 데이터로 유지한다.

## 다음 조치

1. `endings.json`의 조건도 구조화한다.
2. `pickEnding` 함수가 구조화된 엔딩 조건을 읽도록 개선한다.
3. Google Sheets 원본 탭도 구조화 필드에 맞춰 확장한다.
4. 로컬 또는 GitHub Actions 빌드 결과를 확인한다.
