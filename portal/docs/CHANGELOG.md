# 변경 이력 (CHANGELOG)

## [0.1.0] - 2026-07-14 — EBTS 통합업무포털 MVP 초기 구현
### 추가 (Added)
- 무의존성 Node(`node:sqlite`+`node:http`) 백엔드, SQLite 스키마/마이그레이션(`001_init.sql`).
- 인증: 초기 관리자 설정, 로그인/로그아웃, scrypt 비밀번호 해시, httpOnly 세션 쿠키,
  로그인 실패 5회 잠금, 계정 정지 시 세션 강제 종료.
- RBAC: 역할 6종 + 세분화 권한 18종, 역할·사용자별 권한 조정, 서버 라우트 강제.
- 도메인: 사용자 관리, 부서 관리(계층·부서장), 역할·권한 편집, 권한별 대시보드.
- 업무일지: 작성/조회/수정/승인/소프트삭제, 공개범위 5종, 낙관적 잠금(version) 충돌 감지.
- 조합원 인적사항: 목록 마스킹, 목적 입력 후 원문 열람, 개인정보 열람이력 기록, 등록/수정.
- 감사 로그(활동/개인정보 열람이력) 읽기 전용, 사용량·저장공간 조회.
- 프론트: 순수 HTML/CSS/JS 반응형 SPA(CSP 준수, 권한별 메뉴, 모바일 하단 메뉴).
- 테스트: API 통합 30개(`portal:test`), 브라우저 UI 11개(`ui-test.mjs`) — 전부 통과.
- 문서: README + REQUIREMENTS/ARCHITECTURE/DATABASE/PERMISSIONS/SECURITY/COST_ESTIMATE/
  DEPLOYMENT/USER_GUIDE/ADMIN_GUIDE/TEST_PLAN/ROADMAP_UNDONE, `.env.example`.

### 보안 (Security)
- 파라미터 바인딩(SQL Injection 방지), 출력 이스케이프(XSS 방지), CSP/보안 헤더,
  정적 경로 탈출 차단, 비밀값 커밋 금지(.gitignore).

### 비고
- 게임 저장소(`red-ledger-game`)의 기존 코드는 변경하지 않음. 포털은 `portal/` 하위에 독립 구현.
- 파일함/매뉴얼/칸반/알림/실시간(웹소켓) 및 PostgreSQL/RLS 전환은 미구현 → `ROADMAP_UNDONE.md`.
