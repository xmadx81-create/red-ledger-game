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
- 새로고침 후 진행 상태가 유지되는가
- `다시 운영하기` 또는 `새 운영 시작`으로 초기화되는가

## 6. 저장/불러오기 확인

현재 MVP는 브라우저 `localStorage`에 진행 상태를 자동 저장한다.

확인 순서:

```text
1. 선택지 A 또는 B를 클릭한다.
2. Day와 자원 값이 변경되는지 확인한다.
3. 브라우저를 새로고침한다.
4. 변경된 Day와 자원 값이 유지되는지 확인한다.
5. 새 운영 시작 버튼을 누른다.
6. Day 1 초기 상태로 돌아오는지 확인한다.
```

저장 키:

```text
red-ledger:mvp-save:v1
```

## 7. 현재 주의사항

- 저장은 현재 브라우저/기기 기준이다.
- 계정 기반 클라우드 저장은 아직 없다.
- 이벤트 발생 조건은 아직 실제 조건 분기보다 일차 순서 중심이다.
- `events.json`의 선택지 효과와 `endings.json`의 엔딩 조건은 구조화 완료되었다.
