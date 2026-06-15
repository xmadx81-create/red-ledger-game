# 적혈의 장부 — 게임 기획 인덱스

작성일: 2026-06-16

## 1. 프로젝트 개요

`적혈의 장부 / Red Ledger`는 헌혈센터를 가장한 가상 기관 `혈연센터`를 운영하며, 표면 조직의 신뢰와 이면 조직의 요구 사이에서 균형을 잡는 다크 행정 누아르 운영 시뮬레이션이다.

## 2. MVP 목표

1차 MVP는 7일 운영 구조를 기준으로 한다.

핵심 목표:

- 매일 발생하는 운영 이벤트 처리
- 핵심 자원 변화 관리
- 주요 인물과의 관계/위험 관리
- 7일차 결산 후 엔딩 분기

## 3. 핵심 문서 구조

```text
docs/game-design/
├─ 00_game-design-index.md
├─ 01_core-loop.md
├─ 02_resources.md
├─ 03_events.md
├─ 04_characters.md
└─ 05_endings.md
```

## 4. 현재 데이터 기준

Google Sheets `Red_Ledger_Development_Master`에 아래 탭을 기준으로 1차 MVP 데이터가 입력되어 있다.

| 탭 | 입력 상태 |
|---|---|
| Resources | 핵심 자원 8개 입력 완료 |
| Events | 7일 운영 이벤트 7개 입력 완료 |
| Characters | 주요 인물 5명 입력 완료 |
| Endings | 엔딩 5개 입력 완료 |
| Bug_Report | 헤더 생성 완료 |

## 5. 다음 작업

1. `Resources` 수치 밸런스 1차 검토
2. `Events` 선택지 효과 조정
3. `Characters` 등급/능력/관계 세분화
4. Figma 화면과 실제 데이터 표시 방식 연결
5. MVP 코드 구조 설계
