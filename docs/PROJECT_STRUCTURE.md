# 프로젝트 폴더 구조

이 문서는 `red-ledger-game` 저장소의 기본 폴더 구조와 각 폴더의 역할을 정리합니다.

## 기본 구조

```text
red-ledger-game/
├─ docs/
│  ├─ preprocessing/
│  ├─ game-design/
│  ├─ system-design/
│  ├─ data-design/
│  ├─ ui-ux/
│  └─ operations/
├─ assets/
│  ├─ references/
│  └─ concept-art/
└─ src/
```

## 폴더별 역할

| 경로 | 역할 |
|---|---|
| `docs/preprocessing/` | 전처리 단계 기록, 체크리스트, 작업 로그 |
| `docs/game-design/` | 세계관, 장르, 핵심 루프, 캐릭터, 이벤트, MVP 기획 |
| `docs/system-design/` | 게임 시스템, 자원 구조, 상태값, 진행 규칙, 세이브 구조 |
| `docs/data-design/` | 시트/JSON/CSV 등 데이터 설계 기준 |
| `docs/ui-ux/` | 화면 설계, UI 흐름, 와이어프레임 기준 |
| `docs/operations/` | 일정, 회의록, 작업 분배, 협업 운영 기준 |
| `assets/references/` | 레퍼런스 이미지, 분위기 자료, 조사 자료 |
| `assets/concept-art/` | 컨셉 아트, 로고, 캐릭터/배경 이미지 초안 |
| `src/` | 실제 게임 소스 코드 |

## 운영 원칙

- 기획과 의사결정은 `docs/` 아래에 남깁니다.
- 이미지와 참고자료는 `assets/` 아래에 분리합니다.
- 실제 실행 코드와 구현 파일은 `src/` 아래에 둡니다.
- 전처리 단계가 끝나기 전까지는 문서 구조를 먼저 안정화합니다.
- 폴더 역할이 애매한 자료는 우선 `docs/operations/` 또는 `assets/references/`에 임시 보관한 뒤 정리합니다.
