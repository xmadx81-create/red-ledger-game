# Web MVP GitHub Pages 배포 성공 기록

## 기록 일자

```text
2026-06-15
```

## 결과

Web MVP가 GitHub Pages에서 정상 표시되는 것을 확인했습니다.

## 접속 주소

```text
https://xmadx81-create.github.io/red-ledger-game/
```

직접 Web MVP 주소:

```text
https://xmadx81-create.github.io/red-ledger-game/src/web-mvp/
```

## 확인 화면

화면에서 다음 항목이 정상 표시되었습니다.

```text
RED-LEDGER-GAME
적혈의 장부
The Red Ledger
봉인된 운영 기록
MVP
새 게임
```

## 최종 배포 방식

GitHub Actions 기반 Pages 배포는 `configure-pages` 단계에서 반복 실패했습니다.

최종적으로는 다음 방식으로 전환했습니다.

```text
GitHub Pages Source: Deploy from a branch
Branch: main
Folder: / root
```

## Pages용 파일

```text
index.html
.nojekyll
src/web-mvp/
```

## 유지되는 자동 검증

Web MVP의 데이터/기본 흐름 검증은 GitHub Actions Smoke Test로 유지합니다.

```text
.github/workflows/web-mvp-smoke-test.yml
src/web-mvp/tests/smoke-test.mjs
```

Smoke Test는 성공 상태를 확인했습니다.

## 이후 작업

```text
1. 모바일 화면 실제 플레이 테스트
2. 새 게임 버튼 클릭 흐름 확인
3. Day 1~Day 7 진행 테스트
4. 결과 화면 및 최종 평가 확인
5. 배포 성공 URL을 README 또는 운영 문서에 연결
```
