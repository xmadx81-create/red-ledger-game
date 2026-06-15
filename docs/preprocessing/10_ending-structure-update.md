# 2026-06-16 — 엔딩 조건 구조화 기록

## 작업자

ChatGPT + 백무결

## 작업 구분

MVP 엔딩 판정 구조 정리 / 하드코딩 제거

## 기존 문제

기존 상태:

- `data/endings.json`에는 엔딩 조건이 문자열로만 들어 있었다.
- `src/gameEngine.ts`의 `pickEnding` 함수가 엔딩 조건을 코드 안에 직접 하드코딩하고 있었다.
- 따라서 엔딩 조건을 수정하려면 JSON이 아니라 TypeScript 코드를 직접 수정해야 했다.

## 수정 내용

- `src/types.ts`에 구조화된 조건 타입을 추가했다.
  - `ResourceConditionOperator`
  - `ResourceCondition`
  - `EndingConditions`
- `data/endings.json`에 `conditions` 객체를 추가했다.
- 각 엔딩은 `conditions.all` 또는 `conditions.any`를 가진다.
- `src/gameEngine.ts`에 조건 평가 함수를 추가했다.
  - `evaluateCondition`
  - `matchesEnding`
- `pickEnding`은 이제 `endings.json`의 조건과 우선순위를 읽어 엔딩을 판정한다.

## 수정 파일

```text
src/types.ts
data/endings.json
src/gameEngine.ts
docs/game-design/06_data-schema.md
data/README.md
```

## 조건 예시

```json
{
  "resourceId": "RES_UNREST",
  "operator": "gte",
  "value": 85
}
```

## 지원 연산자

| 연산자 | 의미 |
|---|---|
| `gt` | 초과 |
| `gte` | 이상 |
| `lt` | 미만 |
| `lte` | 이하 |
| `eq` | 같음 |

## 결과

- 엔딩 판정 조건이 JSON 데이터로 이동했다.
- 코드와 데이터의 역할이 더 분리되었다.
- 이후 밸런스 조정 시 `endings.json`만 수정하면 된다.

## 다음 조치

1. 이벤트 발생 조건도 구조화한다.
2. GitHub Actions 또는 로컬 빌드로 TypeScript 검증을 진행한다.
3. 저장/불러오기 기능을 추가한다.
4. 후보E 카드형 UI 규칙을 MVP 화면에 반영한다.
