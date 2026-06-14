# Google Drive 저장 구조

이 문서는 `red-ledger-game` 프로젝트의 Google Drive 저장 구조를 정의합니다.

## 목적

Google Drive는 GitHub에 넣기 어려운 원본 문서, 이미지, PDF, 공유 자료, 대용량 파일을 관리하는 공간입니다.

GitHub가 프로젝트의 최종 기준 저장소라면, Google Drive는 작업용 원본 자료와 공유 자료의 저장소입니다.

## 권장 최상위 폴더명

```text
red-ledger-game
```

또는 한글 병기형을 사용할 경우:

```text
red-ledger-game_적혈의장부
```

## 권장 폴더 구조

```text
red-ledger-game_적혈의장부/
├─ 00_admin/
├─ 01_planning/
├─ 02_references/
├─ 03_design/
├─ 04_data/
├─ 05_exports/
├─ 06_meetings/
└─ 99_archive/
```

## 폴더별 역할

| 폴더 | 역할 |
|---|---|
| `00_admin/` | 프로젝트 운영 기준, 계정/도구 연결 메모, 공유 권한 기록 |
| `01_planning/` | 기획서 원본, 세계관 문서, MVP 기획 초안 |
| `02_references/` | 분위기 참고 이미지, 장르 참고 자료, 조사 자료 |
| `03_design/` | Figma 내보내기 파일, 이미지 시안, UI 참고 자료 |
| `04_data/` | Google Sheets 백업, CSV, 데이터 내보내기 자료 |
| `05_exports/` | 외부 공유용 PDF, 발표용 문서, 내보내기 결과물 |
| `06_meetings/` | 회의록, 검토 메모, 의사결정 자료 |
| `99_archive/` | 폐기/보류/이전 버전 자료 |

## GitHub와 Google Drive의 역할 구분

| 구분 | GitHub | Google Drive |
|---|---|---|
| 최종 기준 문서 | 사용 | 보조 |
| 작업 로그 | 사용 | 필요 시 백업 |
| 코드 | 사용 | 사용하지 않음 |
| Markdown 문서 | 사용 | 공유용 변환본 가능 |
| 이미지 원본 | 제한적 사용 | 사용 |
| 대용량 자료 | 사용하지 않음 | 사용 |
| 회의용 문서 | 요약본 사용 | 원본 사용 |
| 공유용 PDF | 링크 기록 | 파일 보관 |

## Google Drive에 직접 저장할 자료

- 회의용 Google Docs
- 발표/공유용 PDF
- 레퍼런스 이미지
- 이미지 원본
- Figma 내보내기 이미지
- Google Sheets 백업 파일
- 외부 AI에게 전달할 압축 자료
- 임시 기획 초안

## Google Drive에 저장하지 않을 자료

- 비밀번호
- API 키
- Personal Access Token
- GitHub 비밀키
- 개인 인증 정보
- 민감한 계정 정보

민감 정보는 어떤 도구에도 평문으로 저장하지 않습니다.

## 파일명 규칙

파일명은 정렬과 검색이 쉽도록 다음 형식을 권장합니다.

```text
YYYY-MM-DD_분류_제목_버전
```

예시:

```text
2026-06-15_planning_mvp-7days-v1
2026-06-15_reference_dark-noir-ui
2026-06-15_meeting_preprocessing-notes
```

## 공유 권한 원칙

- 기본은 비공개로 유지합니다.
- 외부 공유가 필요한 파일만 개별 공유합니다.
- 링크 공유는 필요할 때만 켭니다.
- 공유한 파일은 `00_admin/` 또는 GitHub 작업 로그에 기록합니다.
- 프로젝트 종료 또는 역할 변경 시 공유 권한을 점검합니다.

## 새 세션에서 Google Drive를 찾는 기준

새 세션 또는 외부 AI가 Google Drive 자료를 사용해야 할 때는 다음 순서로 확인합니다.

1. GitHub의 `docs/operations/GOOGLE_DRIVE_STRUCTURE.md` 확인
2. Drive 최상위 폴더 `red-ledger-game_적혈의장부` 확인
3. 필요한 자료 유형에 맞는 하위 폴더 확인
4. 최종 확정 내용은 GitHub 문서에 다시 반영

## 현재 상태

- Google Drive 실제 폴더 생성은 사용자 확인 또는 별도 Drive 연결 후 진행합니다.
- 본 문서는 Google Drive 폴더를 만들 때 따라야 할 기준 구조입니다.
