# Red Ledger Data

작성일: 2026-06-16

이 폴더는 `적혈의 장부 / Red Ledger` MVP에서 사용할 기초 게임 데이터를 보관한다.

## 파일 구조

```text
data/
├─ README.md
├─ resources.csv
├─ resources.json
├─ events.csv
├─ events.json
├─ characters.csv
├─ characters.json
├─ endings.csv
└─ endings.json
```

## 관리 원칙

- Google Sheets `Red_Ledger_Development_Master`가 사람이 편집하는 원본이다.
- GitHub `data/` 폴더는 코드에서 읽을 수 있는 배포용 데이터다.
- CSV는 검토용, JSON은 게임 코드 연동용으로 사용한다.
- Sheets 수정 후에는 CSV/JSON도 함께 갱신한다.

## 현재 코드 연동 기준

| 파일 | 코드 연동 상태 |
|---|---|
| `resources.json` | `src/data.ts`에서 직접 import |
| `events.json` | `src/data.ts`에서 직접 import, 선택지 효과 구조화 완료 |
| `characters.json` | `src/data.ts`에서 직접 import |
| `endings.json` | `src/data.ts`에서 직접 import, 엔딩 판정 조건 구조화 완료 |

## 주의사항

- `events.json`은 `choices.A.effects`, `choices.B.effects` 배열을 가진다.
- `endings.json`은 `conditions.all`, `conditions.any` 배열을 가진다.
- `events.csv`와 `endings.csv`는 사람이 검토하기 쉬운 문자열 설명을 유지한다.
- 다음 단계에서는 이벤트 발생 조건도 구조화할 수 있다.
