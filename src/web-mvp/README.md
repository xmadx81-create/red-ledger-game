# 적혈의 장부 Web MVP

이 폴더는 `red-ledger-game` 1차 웹 MVP 프로토타입을 보관합니다.

## 목적

브라우저에서 실행 가능한 7일 운영 프로토타입을 만드는 것이 목표입니다.

검증 대상:

```text
새 게임 시작
Day 1~Day 7 진행
각 Day 이벤트 표시
선택지 선택
자원 변화 적용
인물 반응 표시
최종 평가 화면 출력
```

## 파일 구조

```text
src/web-mvp/
├─ index.html
├─ styles.css
├─ app.js
└─ data/
   ├─ resources.json
   ├─ characters.json
   ├─ events.json
   └─ choices.json
```

## 실행 방법

브라우저 정책상 `index.html`을 파일로 직접 열면 JSON 데이터 로딩이 막힐 수 있습니다.

따라서 간단한 로컬 서버로 실행합니다.

예시:

```bash
cd src/web-mvp
python -m http.server 8000
```

그 다음 브라우저에서 접속합니다.

```text
http://localhost:8000
```

## 현재 구현된 기능

- 타이틀 화면
- 프로젝트 정보 화면
- 새 게임 시작
- Day 1~Day 7 진행
- Day별 이벤트 로드
- 선택지 표시
- 선택지 클릭 처리
- 자원 변화 적용
- 0~100 범위 보정
- 수요/공급 판정
- 인물 반응 표시
- 엔딩 플래그 누적
- 최종 평가 화면

## 아직 미구현 또는 후속 작업

- 저장/불러오기
- 사운드
- 고급 애니메이션
- 세부 인물 관계 수치화
- Google Sheets 실시간 연동
- 모바일 앱 패키징
- 접근성 개선
- 테스트 자동화

## 기준 문서

```text
docs/system-design/MVP_IMPLEMENTATION_PLAN.md
docs/system-design/PROTOTYPE_TASK_LIST.md
docs/system-design/ENGINE_SELECTION_NOTES.md
docs/ui-ux/UI_COMPONENT_SPEC.md
docs/ui-ux/SCREEN_DATA_EVENT_MAP.md
```
