# 본격 기획 단계 작업 로그 부록 - 데이터 무결성 점검

## 작업 주제

Google Sheets 반영 전 데이터 무결성 점검

## 진행 내용

1. `docs/data-design/DATA_INTEGRITY_CHECK_RULES.md`를 생성했다.
2. CSV 데이터 간 ID 연결, 명칭 일치, 참조 관계를 점검하기 위한 기준을 정리했다.
3. `docs/data-design/DATA_INTEGRITY_CHECK_RESULT_001.md`를 생성했다.
4. 현재 GitHub에 저장된 캐릭터, 이벤트, 선택지, 밸런싱, UI 화면목록 CSV 템플릿을 기준으로 1차 점검 결과를 기록했다.
5. 선택지 CSV가 Day 1~Day 4와 Day 5~Day 7로 분리되어 있으므로 실제 Sheets에서는 하나의 `06_선택지` 탭에 이어 붙이도록 정리했다.
6. 데이터 기준명과 UI 노출명 차이를 주의 사항으로 기록했다.

## 생성한 파일

```text
docs/data-design/DATA_INTEGRITY_CHECK_RULES.md
docs/data-design/DATA_INTEGRITY_CHECK_RESULT_001.md
docs/data-design/PLANNING_WORK_LOG_APPENDIX_DATA_INTEGRITY.md
```

## 1차 판정

```text
Google Sheets 반영 가능
```

## 주의 사항

- 실제 Sheets 반영 시 선택지 CSV 헤더를 중복 삽입하지 않는다.
- 계산식과 데이터 기준명은 `혈액 재고`, `혈액 수요`를 사용한다.
- UI 노출명은 `핵심 재고`, `이면 수요` 등 장면 분위기에 맞게 다르게 사용할 수 있다.

## 다음 작업

1. 실제 Google Sheets 파일 생성
2. CSV 템플릿 반영
3. 선택지ID와 이벤트ID 2차 점검
4. 밸런싱 루트별 최종 자원값 계산
