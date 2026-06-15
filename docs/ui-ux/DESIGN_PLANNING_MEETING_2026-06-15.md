# 디자인 작업 기획 회의록

## 회의 일자

2026-06-15

## 회의 목적

Web MVP 배포 이후 확인된 현재 UI 상태를 기준으로, 디자인 적용 시점과 Figma 기준 활용 방식을 결정합니다.

## 현재 확인 사항

### 1. Figma 저장 여부

Figma 파일은 저장되어 있으며, 최종 기준 파일은 다음으로 확정합니다.

```text
https://www.figma.com/design/JmrFNGQidVXyZu52IdmgxK
```

Figma 파일명 기준:

```text
red-ledger-game_적혈의장부_UIUX
```

현재 Figma에는 다음 기준이 기록되어 있습니다.

```text
모바일 첫 화면 흐름 와이어프레임
SCR-010 최종 평가 화면
공통 컴포넌트 기준 보드
ResourceBar
ReportCard
ChoiceCard
ResultChangeCard
BottomNav
```

### 2. 현재 Web MVP 디자인 적용 상태

현재 Web MVP에는 Figma 전체 디자인이 완전히 적용된 것이 아닙니다.

현재 적용된 것은 다음 단계입니다.

```text
CSS 디자인 1차 패스
UX 정보 구조 2차 패스
모바일 카드/버튼/자원 표시 개선
선택 이력 카드화
사건 메타 정보 표시
최종 보고서 가독성 개선
```

즉, 현재 버전은 다음으로 분류합니다.

```text
기능 검증형 MVP + 1차 UI 개선 버전
```

아직 다음 상태는 아닙니다.

```text
Figma 기준 완전 반영 버전
완성형 게임 UI
아트/일러스트 포함 최종 디자인
```

## 핵심 판단

### 질문 1. 디자인을 먼저 할 것인가, 컨텐츠를 먼저 할 것인가?

결론:

```text
디자인 골격을 먼저 정리한 뒤, 컨텐츠를 확장한다.
```

이유:

```text
컨텐츠를 먼저 대량 추가하면 화면 구조가 흔들릴 때 수정 비용이 커진다.
현재 UI는 아직 정보 위계와 컴포넌트 기준이 안정되지 않았다.
따라서 최소 디자인 시스템과 화면 구조를 먼저 확정해야 한다.
```

### 질문 2. 지금 바로 고급 비주얼을 넣을 것인가?

결론:

```text
아직 고급 일러스트/캐릭터 아트/배경 원화는 넣지 않는다.
```

이유:

```text
컨텐츠 구조가 아직 바뀔 가능성이 높다.
일러스트를 먼저 넣으면 이후 수정 비용이 커진다.
먼저 카드, 자원, 선택지, 보고서, 최종 평가의 구조를 안정화한다.
```

## 디자인 적용 단계 결정

### Phase D1. 디자인 시스템 정리

목표:

```text
색상
폰트 크기
간격
카드 구조
버튼 구조
자원 표시 규칙
위험도 표시 규칙
```

산출물:

```text
docs/ui-ux/WEB_MVP_DESIGN_SYSTEM.md
src/web-mvp/styles.css 정리
```

### Phase D2. Figma 기준 화면 매칭

목표:

```text
SCR-001 타이틀 화면
SCR-002 Day 시작 보고
SCR-005 이벤트 발생 화면
SCR-006 선택 결과 화면
SCR-009 최종 평가 화면
```

현재 Web MVP 화면과 Figma 화면을 1:1로 맞춥니다.

산출물:

```text
docs/ui-ux/FIGMA_TO_WEB_SCREEN_MAPPING.md
```

### Phase D3. 컴포넌트 적용

Figma의 공통 컴포넌트를 Web MVP에 적용합니다.

대상:

```text
ResourceBar
ReportCard
ChoiceCard
ResultChangeCard
BottomNav
HistoryCard
FinalReportPanel
```

산출물:

```text
src/web-mvp/app.js 컴포넌트 렌더링 정리
src/web-mvp/styles.css 컴포넌트 단위 정리
```

### Phase D4. 컨텐츠 확장

디자인 골격이 안정된 뒤 컨텐츠를 확장합니다.

대상:

```text
선택지 영향 미리보기
엔딩 문장 강화
인물 반응 세분화
Day별 사건 밀도 강화
반복 회차 구조
```

### Phase D5. 아트/비주얼 강화

컨텐츠 구조가 안정된 뒤 본격 비주얼을 적용합니다.

대상:

```text
인물 초상
건물/센터 배경
봉인 문서 이미지
가문 문장
자원 아이콘
위험도 아이콘
```

## 오늘의 결정 사항

```text
1. 현재 Web MVP는 배포 성공 및 1차 UI 개선 상태로 본다.
2. Figma는 최종 기준 파일이 존재하며 저장되어 있다.
3. 다음 작업은 Figma 기준을 Web MVP에 반영하는 디자인 시스템 정리다.
4. 컨텐츠 대량 확장은 디자인 골격 정리 이후 진행한다.
5. 고급 아트 적용은 컨텐츠 구조 안정화 이후로 미룬다.
```

## 즉시 다음 작업

```text
1. WEB_MVP_DESIGN_SYSTEM.md 작성
2. FIGMA_TO_WEB_SCREEN_MAPPING.md 작성
3. styles.css를 디자인 토큰/컴포넌트 단위로 정리
4. app.js 렌더링 구조를 화면 컴포넌트 단위로 정리
5. 배포 화면에서 모바일 기준 실제 확인
```

## 최종 기준 링크

```text
Web MVP:
https://xmadx81-create.github.io/red-ledger-game/src/web-mvp/

Figma:
https://www.figma.com/design/JmrFNGQidVXyZu52IdmgxK

GitHub:
https://github.com/xmadx81-create/red-ledger-game
```
