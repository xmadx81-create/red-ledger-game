# 적혈의 장부 / Red Ledger

**다크 행정 누아르 운영 시뮬레이션 게임 프로젝트**

> 낮에는 생명을 나누고, 밤에는 생존을 계산한다.

## 프로젝트 개요

《적혈의 장부》는 가상 기관 `혈연센터`를 운영하며, 표면 조직의 신뢰와 이면 조직의 요구 사이에서 선택을 내리는 다크 행정 누아르 운영 시뮬레이션 게임입니다.

## 1차 MVP

- 플레이 기간: 7일
- 핵심 화면: 운영 대시보드, 일일 사건 선택, 자원 변화, 인물 목록, 엔딩
- 핵심 시스템: 혈액 재고, 가문 자금, 가문 위신, 인간 신뢰, 언론 노출, 조직 불안, 보안 등급, 가문 만족도
- 데이터 방식: Google Sheets 원본 + GitHub CSV/JSON 배포 데이터
- 현재 프로토타입: Vite + React + TypeScript

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:5173
```

## 주요 폴더 구조

```text
red-ledger-game/
├─ data/
│  ├─ resources.csv
│  ├─ resources.json
│  ├─ events.csv
│  ├─ events.json
│  ├─ characters.csv
│  ├─ characters.json
│  ├─ endings.csv
│  └─ endings.json
├─ docs/
│  ├─ preprocessing/
│  └─ game-design/
├─ src/
│  ├─ App.tsx
│  ├─ data.ts
│  ├─ gameEngine.ts
│  ├─ main.tsx
│  ├─ styles.css
│  └─ types.ts
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 현재 구현 상태

- [x] GitHub 전처리 문서 생성
- [x] Google Drive 폴더 구조 생성
- [x] Google Sheets 개발관리 마스터 시트 생성
- [x] Figma MVP UI 파일 생성
- [x] Gmail 템플릿 생성
- [x] Calendar 핵심 일정 일부 등록
- [x] MVP 데이터 CSV/JSON 생성
- [x] Vite React TypeScript 코드 뼈대 생성
- [x] 7일 운영 선택지 적용 로직 생성
- [x] 엔딩 판정 로직 생성

## 다음 작업

1. 선택지 효과를 완전한 구조화 데이터로 분리
2. 저장/불러오기 기능 추가
3. Figma 화면 기준 UI 세부 정리
4. 카드/인물 도감 시스템 설계
5. 첫 플레이어블 빌드 테스트
