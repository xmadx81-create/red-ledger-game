# Web MVP GitHub Pages 배포 보류 기록

## 기록 일자

```text
2026-06-15
```

## 상황

`src/web-mvp`를 GitHub Pages로 미리보기 배포하려고 했으나, 저장소가 private 상태라 Pages 활성화가 차단되었습니다.

## GitHub Actions 에러

```text
Get Pages site failed.
Create Pages site failed.
Resource not accessible by integration.
```

## 원인 판단

현재 저장소 `xmadx81-create/red-ledger-game`은 private 저장소입니다.

GitHub Pages 화면에서 다음 안내가 표시되었습니다.

```text
페이지 기능을 활성화하려면 이 저장소를 업그레이드하거나 공개 설정하세요.
```

따라서 현재 계정/저장소 상태에서는 GitHub Pages 배포를 바로 사용할 수 없습니다.

## 처리 내용

반복 실패를 막기 위해 다음 워크플로우 파일을 삭제했습니다.

```text
.github/workflows/web-mvp-pages.yml
```

삭제 커밋:

```text
5b6be162cad7ee14349fee801110043b41aa2f95
```

## 유지되는 자동 검증

GitHub Pages 배포는 보류하지만, Web MVP smoke test는 유지합니다.

```text
.github/workflows/web-mvp-smoke-test.yml
src/web-mvp/tests/smoke-test.mjs
```

## 현재 권장 방향

1차 MVP 단계에서는 저장소를 private로 유지하고 로컬 실행으로 테스트합니다.

```bash
cd src/web-mvp
python -m http.server 8000
```

브라우저 접속:

```text
http://localhost:8000
```

## 향후 선택지

| 선택지 | 설명 | 권장도 |
|---|---|---|
| private 유지 + 로컬 테스트 | 기획/코드 비공개 유지 | 높음 |
| 저장소 public 전환 | GitHub Pages 사용 가능성이 높음 | 중간 |
| GitHub 유료/Enterprise 검토 | private Pages 사용 가능성 | 낮음 |
| Vercel/Netlify 등 외부 미리보기 | private repo 연동 가능성 검토 | 중간 |

## 다음 작업

```text
로컬 실행 기준 테스트 진행
smoke test 결과 확인
모바일 화면 개선
외부 배포는 MVP가 안정된 뒤 재검토
```
