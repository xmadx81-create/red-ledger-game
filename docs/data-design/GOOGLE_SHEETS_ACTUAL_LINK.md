# 실제 Google Sheets 링크 기록

이 문서는 `red-ledger-game` 프로젝트의 실제 Google Sheets 관리표 링크와 생성/검증 결과를 기록합니다.

## 생성 일자

```text
2026-06-15
```

## 파일명

```text
red-ledger-game_적혈의장부_관리표
```

## Google Sheets 링크

```text
https://docs.google.com/spreadsheets/d/1X3WIqdhriczNpfFV0VAh6JeUfgCc_taGnz1dKASnMGg/edit
```

## Spreadsheet ID

```text
1X3WIqdhriczNpfFV0VAh6JeUfgCc_taGnz1dKASnMGg
```

## 생성 방식

```text
GitHub 기준 CSV/XLSX 템플릿 → XLSX 원본 생성 → Google Drive 업로드 → Google Sheets 변환
```

## 변환 결과

```text
성공
```

## 확인된 시트

```text
00_대시보드
01_작업목록
02_MVP_7일구조
03_자원
04_캐릭터
05_이벤트
06_선택지
07_밸런싱_상세
07_밸런싱
08_UI화면목록
99_변경로그
```

## 1차 검증 결과

- Google Sheets 파일 생성 확인
- XLSX → Google Sheets 변환 확인
- 11개 시트 생성 확인
- 대시보드 핵심 수량 확인
  - 캐릭터 5명
  - 이벤트 7개
  - 선택지 23개
  - 밸런싱 루트 7개
  - UI 화면 10개
- `07_밸런싱` 시트 최종 자원값 계산 결과 확인

## 제한 사항

현재 사용 가능한 Google Drive 도구에서는 폴더 생성 기능이 노출되지 않아, 프로젝트 폴더 생성 및 파일 이동은 아직 자동 처리하지 못했습니다.

따라서 현재 파일은 Google Drive 기본 위치에 생성된 상태로 봅니다.

추후 폴더 생성/이동 기능이 가능해지거나 사용자가 Drive에서 폴더를 직접 만든 뒤 링크를 제공하면, 해당 폴더 기준으로 문서를 재정리합니다.

## 다음 작업

1. Google Drive에서 프로젝트 폴더 생성 여부 확인
2. 필요 시 이 Google Sheets 파일을 프로젝트 폴더로 이동
3. Google Sheets 내 밸런싱 수치 조정
4. Figma 와이어프레임과 `08_UI화면목록` 연결
5. GitHub 문서와 실제 Sheets 링크 상호 참조 유지
