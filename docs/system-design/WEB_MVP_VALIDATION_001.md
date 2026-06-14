# Web MVP 1차 검증 결과

이 문서는 `src/web-mvp` 1차 코드 생성 후 구조 검증 결과를 기록합니다.

## 점검 일자

```text
2026-06-15
```

## 점검 대상 파일

```text
src/web-mvp/index.html
src/web-mvp/styles.css
src/web-mvp/app.js
src/web-mvp/data/resources.json
src/web-mvp/data/characters.json
src/web-mvp/data/events.json
src/web-mvp/data/choices.json
src/web-mvp/README.md
```

## 점검 결과 요약

| 항목 | 결과 | 비고 |
|---|---|---|
| 기본 HTML 진입점 | 통과 | `index.html` 생성 완료 |
| 스타일 파일 | 통과 | 다크 행정 누아르 CSS 생성 완료 |
| JS 앱 파일 | 통과 | `app.js` 생성 완료 |
| 자원 데이터 | 통과 | 9개 자원 JSON 생성 완료 |
| 캐릭터 데이터 | 통과 | 5명 캐릭터 JSON 생성 완료 |
| 이벤트 데이터 | 통과 | Day 1~Day 7 이벤트 생성 완료 |
| 선택지 데이터 | 통과 | 23개 선택지 생성 완료 |
| 새 게임 시작 | 구조상 통과 | `startNewGame()` 구현 |
| Day 진행 | 구조상 통과 | `advanceDay()` 구현 |
| 자원 변화 적용 | 구조상 통과 | `applyChoice()`에서 0~100 보정 |
| 수요/공급 판정 | 구조상 통과 | `checkSupplyBalance()` 구현 |
| 최종 평가 | 구조상 통과 | `renderFinalReport()` 구현 |
| 클릭 처리 | 수정 완료 | 내부 span 클릭 대응을 위해 `closest()` 기반으로 보완 |

## 수정 사항

### 클릭 이벤트 처리 보완

초기 구현에서는 클릭 대상이 버튼 내부의 `span`으로 잡힐 경우 `dataset`을 읽지 못할 수 있었습니다.

이를 다음 방식으로 보완했습니다.

```text
event.target.closest('[data-action], [data-choice-id]')
```

이제 선택지 카드 내부의 작은 톤 텍스트를 눌러도 상위 버튼의 `data-choice-id`를 정상적으로 찾을 수 있습니다.

## 현재 구현 가능한 흐름

```text
타이틀 화면
→ 새 게임
→ Day 시작 보고
→ 이벤트 화면
→ 선택지 클릭
→ 결과 화면
→ 다음 Day
→ Day 7 이후 최종 평가 화면
```

## 현재 제한 사항

- 실제 브라우저 실행 테스트는 아직 수행 전입니다.
- 로컬 파일 직접 실행 시 JSON 로딩이 브라우저 정책에 막힐 수 있습니다.
- 간단한 로컬 서버 실행이 필요합니다.
- 자동 테스트 코드는 아직 없습니다.
- 저장/불러오기는 아직 없습니다.

## 실행 방법

```bash
cd src/web-mvp
python -m http.server 8000
```

브라우저 접속:

```text
http://localhost:8000
```

## 2차 검증 항목

다음 단계에서는 실제 브라우저에서 아래를 확인합니다.

```text
1. 첫 로딩 시 타이틀 화면 표시
2. 새 게임 버튼 정상 작동
3. Day 1 이벤트 표시
4. 선택지 클릭 정상 작동
5. 자원 변화 표시
6. 다음 Day 이동
7. Day 7 이후 최종 평가 표시
8. 모바일 화면에서 가로 스크롤 발생 여부
```

## 다음 작업

```text
브라우저 실행 테스트
GitHub Pages 또는 미리보기 배포 검토
모바일 화면 1차 조정
저장/불러오기 설계
```
