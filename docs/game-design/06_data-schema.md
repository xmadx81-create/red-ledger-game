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
| `data/events.csv` | 이벤트 데이터 검토용, 사람이 읽기 쉬운 문자열 효과 포함 |
| `data/events.json` | 이벤트 데이터 코드 연동용, 구조화된 선택지 효과 포함 |
| `data/characters.csv` | 캐릭터 데이터 검토용 |
| `data/characters.json` | 캐릭터 데이터 코드 연동용 |
| `data/endings.csv` | 엔딩 데이터 검토용 |
| `data/endings.json` | 엔딩 데이터 코드 연동용, 구조화된 판정 조건 포함 |

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

## 4. Events JSON 스키마

`data/events.json`은 실제 코드가 읽는 기준 데이터다.

| 필드 | 의미 |
|---|---|
| `id` | 이벤트 고유 ID |
| `day` | 발생 일차 |
| `name` | 이벤트명 |
| `condition` | 발생 조건 |
| `risk` | 위험도 |
| `reward` | 보상/역할 |
| `character` | 연결 인물 |
| `memo` | 메모 |
| `choices` | 선택지 묶음 |
| `choices.A` | 선택지 A |
| `choices.B` | 선택지 B |
| `choices.A.label` | 선택지 A 표시명 |
| `choices.A.textEffect` | 선택지 A 사람이 읽는 효과 설명 |
| `choices.A.effects` | 선택지 A 실제 자원 변화 배열 |
| `choices.B.label` | 선택지 B 표시명 |
| `choices.B.textEffect` | 선택지 B 사람이 읽는 효과 설명 |
| `choices.B.effects` | 선택지 B 실제 자원 변화 배열 |

선택지 효과 구조:

```json
{
  "resourceId": "RES_TRUST",
  "amount": 8
}
```

## 5. Events CSV 스키마

`data/events.csv`는 검토와 사람이 읽는 용도다. 코드 연동 기준은 JSON이다.

| 필드 | 의미 |
|---|---|
| `id` | 이벤트 고유 ID |
| `day` | 발생 일차 |
| `name` | 이벤트명 |
| `condition` | 발생 조건 |
| `choiceA` | 선택지 A 표시명 |
| `effectA` | 선택지 A 설명 문자열 |
| `choiceB` | 선택지 B 표시명 |
| `effectB` | 선택지 B 설명 문자열 |
| `risk` | 위험도 |
| `reward` | 보상/역할 |
| `character` | 연결 인물 |
| `memo` | 메모 |

## 6. Characters 스키마

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

## 7. Endings JSON 스키마

`data/endings.json`은 실제 엔딩 판정 기준 데이터다.

| 필드 | 의미 |
|---|---|
| `id` | 엔딩 고유 ID |
| `name` | 엔딩명 |
| `condition` | 사람이 읽는 조건 설명 |
| `required` | 사람이 읽는 필요 자원 설명 |
| `forbidden` | 사람이 읽는 금지 조건 설명 |
| `summary` | 결과 요약 |
| `unlock` | 후속 해금 |
| `priority` | 판정 우선순위. 숫자가 높을수록 먼저 판정 |
| `type` | 엔딩 타입 |
| `memo` | 메모 |
| `conditions` | 실제 판정 조건 묶음 |
| `conditions.all` | 모두 만족해야 하는 조건 배열 |
| `conditions.any` | 하나 이상 만족하면 되는 조건 배열 |

조건 구조:

```json
{
  "resourceId": "RES_EXPOSURE",
  "operator": "gte",
  "value": 80
}
```

지원 연산자:

| 연산자 | 의미 |
|---|---|
| `gt` | 초과 |
| `gte` | 이상 |
| `lt` | 미만 |
| `lte` | 이하 |
| `eq` | 같음 |

엔딩 예시:

```json
{
  "id": "END_COLLAPSE",
  "priority": 100,
  "conditions": {
    "any": [
      { "resourceId": "RES_UNREST", "operator": "gte", "value": 85 },
      { "resourceId": "RES_BLOOD", "operator": "lte", "value": 5 }
    ]
  }
}
```

## 8. 다음 작업

- Google Sheets 원본 탭도 JSON 구조와 맞춰 확장한다.
- 이벤트 발생 조건도 문자열에서 구조화 조건으로 바꾼다.
- 저장/불러오기 기능을 추가한다.
