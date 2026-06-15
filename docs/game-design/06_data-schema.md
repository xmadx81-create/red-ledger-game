# 적혈의 장부 — 데이터 스키마

작성일: 2026-06-16

## 1. 데이터 저장 원칙

MVP 데이터는 Google Sheets에서 편집하고 GitHub `data/` 폴더에 CSV/JSON으로 저장한다.

```text
Google Sheets = 사람이 편집하는 원본
GitHub CSV = 검토/이관용
GitHub JSON = 게임 코드 연동용
```

## 2. 파일 목록

| 파일 | 용도 |
|---|---|
| `data/resources.csv` | 자원 데이터 검토용 |
| `data/resources.json` | 자원 데이터 코드 연동용 |
| `data/events.csv` | 이벤트 데이터 검토용 |
| `data/events.json` | 이벤트 데이터 코드 연동용 |
| `data/characters.csv` | 캐릭터 데이터 검토용 |
| `data/characters.json` | 캐릭터 데이터 코드 연동용 |
| `data/endings.csv` | 엔딩 데이터 검토용 |
| `data/endings.json` | 엔딩 데이터 코드 연동용 |

## 3. Resources 스키마

| 필드 | 의미 |
|---|---|
| `id` | 자원 고유 ID |
| `name` | 자원명 |
| `initial` | 시작값 |
| `min` | 최소값 |
| `max` | 최대값 |
| `increase` | 증가 조건 |
| `decrease` | 감소 조건 |
| `impact` | 게임 영향 |
| `ui` | UI 표시 위치 |
| `memo` | 메모 |

## 4. Events 스키마

| 필드 | 의미 |
|---|---|
| `id` | 이벤트 고유 ID |
| `day` | 발생 일차 |
| `name` | 이벤트명 |
| `condition` | 발생 조건 |
| `choiceA` | 선택지 A |
| `effectA` | 선택지 A 효과 |
| `choiceB` | 선택지 B |
| `effectB` | 선택지 B 효과 |
| `risk` | 위험도 |
| `reward` | 보상/역할 |
| `character` | 연결 인물 |
| `memo` | 메모 |

## 5. Characters 스키마

| 필드 | 의미 |
|---|---|
| `id` | 캐릭터 고유 ID |
| `name` | 이름 |
| `affiliation` | 소속 |
| `role` | 역할 |
| `grade` | 등급 |
| `loyalty` | 충성도 |
| `risk` | 위험도 |
| `ability` | 능력 |
| `skill` | 스킬 |
| `relationship` | 관계 |
| `unlock` | 해금 조건 |
| `memo` | 메모 |

## 6. Endings 스키마

| 필드 | 의미 |
|---|---|
| `id` | 엔딩 고유 ID |
| `name` | 엔딩명 |
| `condition` | 조건 |
| `required` | 필요 자원 |
| `forbidden` | 금지 조건 |
| `summary` | 결과 요약 |
| `unlock` | 후속 해금 |
| `priority` | 판정 우선순위 |
| `type` | 엔딩 타입 |
| `memo` | 메모 |

## 7. 다음 작업

- JSON 데이터를 불러오는 코드 구조를 만든다.
- 선택지 효과 문자열을 실제 수치 변화 객체로 분해할지 결정한다.
- MVP 구현 전 `effectA`, `effectB`를 구조화할 필요가 있다.

예시:

```json
{
  "resource": "RES_TRUST",
  "delta": 8
}
```
