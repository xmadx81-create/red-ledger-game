# Web MVP 미리보기 배포 설정

이 문서는 `src/web-mvp`를 GitHub Pages로 미리보기 배포하기 위한 설정을 기록합니다.

## 설정 일자

```text
2026-06-15
```

## 목적

로컬 서버 실행 없이도 웹 MVP를 브라우저에서 확인할 수 있도록 GitHub Pages 배포 준비를 합니다.

## 생성한 워크플로우

```text
.github/workflows/web-mvp-pages.yml
```

## 워크플로우 이름

```text
Deploy Web MVP Preview
```

## 배포 대상 폴더

```text
src/web-mvp
```

## 실행 조건

```text
src/web-mvp/** 변경 시
.github/workflows/web-mvp-pages.yml 변경 시
수동 실행 workflow_dispatch
```

## 사용한 GitHub Actions

```text
actions/checkout@v4
actions/configure-pages@v5
actions/upload-pages-artifact@v3
actions/deploy-pages@v4
```

## 예상 배포 결과

GitHub Pages가 저장소에서 허용되고 Actions 기반 Pages 배포가 정상 작동하면, 배포 후 `github-pages` 환경에 미리보기 URL이 생성됩니다.

일반적인 예상 URL 형식은 다음과 같습니다.

```text
https://xmadx81-create.github.io/red-ledger-game/
```

단, 실제 URL은 GitHub Actions 배포 결과의 `page_url`을 기준으로 확인해야 합니다.

## 현재 상태

```text
GitHub Pages 배포 워크플로우 생성 완료
워크플로우 파일 저장 확인 완료
실제 배포 성공 여부는 Actions 실행 후 확인 필요
```

## 제한 사항

- 저장소의 GitHub Pages 설정이 Actions 배포를 허용해야 합니다.
- private 저장소의 Pages 사용 가능 여부는 GitHub 계정/플랜/저장소 설정에 따라 달라질 수 있습니다.
- 아직 실제 배포 성공 URL은 확인 전입니다.
- 배포 실패 시 저장소 Settings → Pages 설정에서 Source가 GitHub Actions로 되어 있는지 확인해야 합니다.

## 로컬 실행 대안

GitHub Pages가 바로 작동하지 않을 경우, 로컬에서 다음 명령으로 실행합니다.

```bash
cd src/web-mvp
python -m http.server 8000
```

브라우저 접속:

```text
http://localhost:8000
```

## 다음 작업

```text
1. GitHub Actions 실행 결과 확인
2. 배포 URL 확인
3. Web MVP smoke test와 Pages deploy 결과를 함께 기록
4. 모바일 화면에서 배포 URL 직접 확인
```
