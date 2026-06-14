# UI 컴포넌트 명세

이 문서는 `red-ledger-game` MVP 구현을 위한 UI 컴포넌트 기준을 정의합니다.

## 목적

Figma 와이어프레임과 실제 구현 사이의 명칭, 역할, 데이터 연결을 맞추기 위한 기준 문서입니다.

## 기준 Figma 파일

```text
https://www.figma.com/design/JmrFNGQidVXyZu52IdmgxK
```

## 기준 페이지

```text
적혈의 장부_MVP_모바일_와이어프레임_최종기준
적혈의 장부_SCR010_컴포넌트_기준
```

## 공통 디자인 방향

```text
다크 행정 누아르
버건디 / 블랙 / 아이보리
문서, 장부, 봉인 보고서, 재고표 중심 UI
과장된 공포보다 차가운 행정적 위화감
```

## 컴포넌트 목록

| 컴포넌트명 | 한국어명 | 용도 | 우선순위 |
|---|---|---|---|
| `ResourceBar` | 자원 바 | 핵심 자원 현황 표시 | 높음 |
| `ResourceCard` | 자원 카드 | 개별 자원 수치 표시 | 높음 |
| `ReportCard` | 보고서 카드 | 사건, 보고, 결과 요약 표시 | 높음 |
| `ChoiceCard` | 선택지 카드 | 플레이어 선택지 표시 | 높음 |
| `ResultChangeCard` | 결과 변화 카드 | 선택 결과와 자원 변화 표시 | 높음 |
| `BottomNav` | 하단 메뉴 | 보고서/인물/기록/설정 이동 | 중간 |
| `HeaderStatus` | 상단 상태 바 | Day, 시간대, 화면 상태 표시 | 높음 |
| `CharacterReactionPanel` | 인물 반응 패널 | 주요 인물 반응과 관계 변화 표시 | 중간 |
| `FinalReportPanel` | 최종 평가 패널 | Day 7 평가와 엔딩 요약 표시 | 높음 |

---

## 1. ResourceBar

### 역할

현재 운영 상황을 한눈에 보여주는 핵심 자원 요약 영역입니다.

### 포함 자원

MVP 초기 화면에서는 다음 5개를 우선 표시합니다.

```text
핵심 재고
이면 수요
신뢰
노출
가문
```

내부 데이터 기준명은 다음과 연결합니다.

| UI 표시명 | 데이터 기준명 |
|---|---|
| 핵심 재고 | 혈액 재고 |
| 이면 수요 | 혈액 수요 |
| 신뢰 | 인간 신뢰 |
| 노출 | 언론 노출 |
| 가문 | 가문 만족도 |

### 상태 표현

| 상태 | 의미 |
|---|---|
| 안정 | 안전 구간 내부 |
| 주의 | 안전 구간 이탈 |
| 위험 | 임계치 접근 |

---

## 2. ResourceCard

### 역할

각 자원의 현재 수치를 표시합니다.

### 필드

```text
label
value
status
trend
```

### 예시

```text
label: 핵심 재고
value: 50
status: 안정
trend: 변화 없음
```

---

## 3. ReportCard

### 역할

문서, 보고서, 사건 설명, Day 목표, 결과 요약을 표시하는 기본 카드입니다.

### 사용 화면

```text
SCR-002 프롤로그 문서
SCR-003 부임 통지
SCR-004 봉인 보고서
SCR-005 Day 1 시작 보고
SCR-008 선택 결과
SCR-010 최종 평가 화면
```

### 필드

```text
title
body
classification
source
```

### 연출 방향

- 일반 문서는 아이보리/검정 계열로 차분하게 표시
- 봉인 문서는 버건디 강조선 사용
- 위험 문서는 하단 경고 스트립 사용

---

## 4. ChoiceCard

### 역할

플레이어가 사건에 대응할 선택지를 표시합니다.

### 선택지 톤

```text
정석
은폐
가문 우선
인간 우선
중용
위험 거래
지연
```

### 필드

```text
choice_id
event_id
choice_text
choice_tone
result_hint
```

### 데이터 연결

Google Sheets `06_선택지` 탭의 다음 필드와 연결합니다.

```text
선택지ID
이벤트ID
선택지문구
선택지톤
결과요약
```

### UI 원칙

- 기본 선택지는 어두운 패널 카드
- 위험하거나 핵심 선택지는 버건디 강조
- 숫자 결과를 전부 공개하지 않고 방향성만 암시

---

## 5. ResultChangeCard

### 역할

선택 후 자원 변화와 인물 반응을 요약합니다.

### 표시 예시

```text
혈액 재고 감소
가문 만족도 증가
보안 등급 소폭 하락
엘리엇: 협력
```

### 데이터 연결

Google Sheets `06_선택지` 탭의 자원 변화 컬럼과 인물 반응 컬럼을 사용합니다.

```text
혈액재고변화
혈액수요변화
가문자금변화
인간신뢰변화
언론노출변화
보안등급변화
가문만족도변화
조직불안변화
암거래단서변화
인물반응
관계변화
```

### UI 원칙

- 플레이어에게는 숫자보다 방향성 우선 표시
- 개발자/밸런싱 화면에서는 숫자 확인 가능

---

## 6. BottomNav

### 역할

모바일 MVP에서 주요 영역으로 이동하는 하단 메뉴입니다.

### 항목

```text
보고서
인물
기록
설정
```

### MVP 기준

1차 MVP에서는 실제 복잡한 라우팅보다 화면 전환 기준만 잡습니다.

---

## 7. HeaderStatus

### 역할

현재 Day, 시간대, 상태를 표시합니다.

### 예시

```text
Day 1
부임 첫날
상태: 관찰 단계
```

### 사용 화면

모든 메인 플레이 화면에 사용합니다.

---

## 8. CharacterReactionPanel

### 역할

주요 인물의 반응과 관계 상태 변화를 표시합니다.

### 표시 예시

```text
김도현: 피로 누적
박세연: 외부 접촉 감지
정하린: 기록 불일치 추적
```

### 데이터 연결

```text
04_캐릭터
05_이벤트
06_선택지
```

---

## 9. FinalReportPanel

### 역할

Day 7 최종 운영 결과와 엔딩 분기를 표시합니다.

### 표시 항목

```text
운영 평가
최종 자원 상태
엔딩 플래그
후속 방향
다음 회차 위험 요소
```

### 사용 화면

```text
SCR-010 최종 평가 화면
```

---

## 화면과 컴포넌트 연결표

| 화면ID | 화면명 | 주요 컴포넌트 |
|---|---|---|
| SCR-001 | 타이틀 화면 | Button |
| SCR-002 | 프롤로그 문서 | ReportCard, Button |
| SCR-003 | 부임 통지 | ReportCard, Button |
| SCR-004 | 봉인 보고서 | ReportCard, Button |
| SCR-005 | Day 1 시작 보고 | HeaderStatus, ReportCard, Button |
| SCR-006 | 핵심 자원 튜토리얼 | ResourceBar, ResourceCard, ReportCard |
| SCR-007 | 첫 선택지 | ResourceBar, ReportCard, ChoiceCard |
| SCR-008 | 선택 결과 | ReportCard, ResultChangeCard, Button |
| SCR-009 | 메인 운영 화면 | HeaderStatus, ResourceBar, ReportCard, CharacterReactionPanel, BottomNav |
| SCR-010 | 최종 평가 화면 | FinalReportPanel, ResourceCard, ReportCard, BottomNav |

## 구현 메모

- 1차 구현에서는 모든 컴포넌트를 완전한 디자인 시스템으로 만들 필요는 없습니다.
- 먼저 화면이 동작하게 만들고, 반복되는 UI를 컴포넌트화합니다.
- Google Sheets의 화면ID, 이벤트ID, 선택지ID를 코드에서도 동일하게 유지합니다.
- 자원 수치 계산은 `CORE_RESOURCE_SYSTEM.md`와 `07_밸런싱` 시트를 기준으로 합니다.

## 다음 문서

```text
docs/system-design/MVP_IMPLEMENTATION_PLAN.md
docs/ui-ux/SCREEN_DATA_EVENT_MAP.md
```
