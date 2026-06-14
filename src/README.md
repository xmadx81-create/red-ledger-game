# 소스 코드

이 폴더는 `red-ledger-game`의 실제 게임 구현 파일을 보관합니다.

## 현재 구현 방향

1차 MVP는 다음 방식으로 진행합니다.

```text
웹 기반 단일 페이지 프로토타입
```

## 현재 생성 예정 구조

```text
src/
└─ web-mvp/
   ├─ index.html
   ├─ styles.css
   ├─ app.js
   └─ data/
      ├─ resources.json
      ├─ characters.json
      ├─ events.json
      └─ choices.json
```

## 보관 대상

- 게임 실행 코드
- 화면 구현 코드
- 데이터 로딩 코드
- 게임 상태 관리 코드
- 이벤트 처리 코드
- 테스트 코드

## 구현 기준 문서

```text
docs/system-design/ENGINE_SELECTION_NOTES.md
docs/system-design/MVP_IMPLEMENTATION_PLAN.md
docs/system-design/PROTOTYPE_TASK_LIST.md
docs/ui-ux/UI_COMPONENT_SPEC.md
docs/ui-ux/SCREEN_DATA_EVENT_MAP.md
```

## 1차 MVP 완료 기준

```text
새 게임을 시작할 수 있다.
Day 1~Day 7까지 진행된다.
각 Day에서 최소 1개 이벤트가 나온다.
각 이벤트마다 선택지가 표시된다.
선택 결과로 자원이 변한다.
Day 7 종료 후 최종 평가가 나온다.
```

## 운영 원칙

- 기획 문서와 데이터 설계 문서는 `docs/`에 둡니다.
- 실행 가능한 코드는 `src/`에 둡니다.
- MVP 단계에서는 복잡한 빌드 도구 없이 브라우저에서 바로 열 수 있는 구조를 우선합니다.
- 이후 필요하면 React, Godot, Unity 등으로 확장합니다.
