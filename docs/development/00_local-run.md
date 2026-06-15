# Red Ledger MVP — 로컬 실행 안내

작성일: 2026-06-16

## 1. 목적

이 문서는 `적혈의 장부 / Red Ledger` 1차 웹 MVP를 로컬 PC에서 실행하는 방법을 정리한다.

## 2. 필요 환경

- Node.js 20 이상 권장
- npm
- Git

## 3. 실행 순서

```bash
git clone <repository-url>
cd red-ledger-game
npm install
npm run dev
```

브라우저에서 아래 주소를 연다.

```text
http://localhost:5173
```

## 4. 빌드 테스트

```bash
npm run build
```

성공 기준:

- TypeScript 오류 없음
- Vite build 완료
- `dist/` 폴더 생성

## 5. 현재 MVP에서 확인할 항목

- 핵심 자원 8개가 표시되는가
- Day 1 이벤트가 표시되는가
- 선택지 A/B 클릭 시 자원이 변하는가
- Day가 7까지 진행되는가
- 7일차 이후 엔딩이 표시되는가
- `다시 운영하기`로 초기화되는가

## 6. 현재 주의사항

- 저장/불러오기 기능은 아직 없다.
- 이벤트 조건은 아직 실제 조건 분기보다 일차 순서 중심이다.
- 선택지 효과는 `src/data.ts`에서 구조화했지만, 원본 `data/events.json`은 아직 문자열 효과를 포함한다.
- 다음 단계에서 `events.json` 자체도 구조화된 효과 배열로 바꾸는 것이 좋다.
