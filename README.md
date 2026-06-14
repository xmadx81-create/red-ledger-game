# 적혈의 장부

**다크 행정 누아르 뱀파이어 운영 시뮬레이션 게임 프로젝트**

> 낮에는 생명을 나누고, 밤에는 생존을 계산한다.

## 프로젝트 개요

《적혈의 장부》는 공익 혈액기관을 가장한 뱀파이어 가문의 비밀 혈액 수급망을 운영하며, 신뢰와 은폐, 생존 사이에서 선택을 내리는 다크 행정 누아르 운영 시뮬레이션 게임입니다.

## 1차 MVP

- 플레이 기간: 7일
- 플레이 시간: 15~25분
- 핵심 화면: 타이틀, 운영 대시보드, 인물 관리, 사건 선택, 엔딩
- 핵심 시스템: 혈액 재고, 가문 위신, 인간 신뢰, 언론 노출, 조직 불안, 보안 등급
- 데이터 방식: 초기 로컬 JSON
- 추후 연동: Supabase, Google Sheets, Notion, OpenAI API

## 폴더 구조

```text
red-ledger-project/
├─ docs/
│  └─ 적혈의_장부_프로젝트_인수인계_v0.1.md
├─ data/
│  ├─ game_design_summary.json
│  └─ asset_manifest.json
└─ assets/
   ├─ backgrounds/
   ├─ characters/
   ├─ events/
   ├─ concept/
   ├─ locations/
   └─ ui/
```

## 다음 작업

1. 2차 개별 에셋 제작 계속
2. 7일 MVP 사건 카드 JSON 정제
3. React/Next.js 프로토타입 코드 작성
4. 생성 이미지 파일명 표준화
5. GitHub 저장소 연결 후 커밋
