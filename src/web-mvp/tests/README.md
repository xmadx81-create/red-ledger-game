# Web MVP 테스트

이 폴더는 `src/web-mvp`의 기본 데이터/흐름 검증 스크립트를 보관합니다.

## 테스트 파일

```text
smoke-test.mjs
```

## 목적

브라우저 실행 전, 다음 항목을 빠르게 검증합니다.

```text
resources.json 9개 자원 확인
characters.json 5명 확인
events.json Day 1~Day 7 확인
choices.json 23개 선택지 확인
모든 선택지가 실제 이벤트ID를 참조하는지 확인
각 Day에 최소 3개 선택지가 있는지 확인
기본 루트 3개를 시뮬레이션해 자원 변화 적용 확인
```

## 실행 방법

프로젝트 루트에서 실행합니다.

```bash
node src/web-mvp/tests/smoke-test.mjs
```

또는 `src/web-mvp` 폴더 기준으로 실행합니다.

```bash
cd src/web-mvp
node tests/smoke-test.mjs
```

## 성공 메시지

정상 통과 시 다음 메시지가 출력됩니다.

```text
Web MVP smoke test passed.
```

## 실패 예시

다음과 같은 문제가 있으면 실패합니다.

```text
선택지가 없는 이벤트
존재하지 않는 이벤트ID를 참조하는 선택지
중복 선택지ID
중복 이벤트ID
알 수 없는 자원 key
예상 수량과 다른 데이터 개수
```

## 다음 테스트 확장 후보

```text
모든 선택지 23개 순회 테스트
Day 1~Day 7 브라우저 클릭 테스트
최종 평가 플래그 우선순위 테스트
모바일 레이아웃 스냅샷 테스트
```
