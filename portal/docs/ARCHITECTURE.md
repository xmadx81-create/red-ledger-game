# 아키텍처 (ARCHITECTURE)

## 1. 시스템 구성도 (참조 MVP)
```
[브라우저 SPA]  public/index.html + js/app.js (CSP 준수, 이벤트 위임)
      │  fetch(JSON) + httpOnly 세션 쿠키
      ▼
[Node http 서버]  server/index.mjs  ── 라우터 + 정적파일 + 보안헤더
      ├─ auth.mjs        로그인/세션/scrypt/잠금
      ├─ rbac.mjs        역할·권한 정의(단일 원천)
      ├─ scope.mjs       업무일지 공개범위 판정
      ├─ audit.mjs       감사/개인정보 열람이력 기록
      └─ handlers/*      도메인별 핸들러(권한·검증·소프트삭제)
      ▼
[node:sqlite]  data/ebts.db  (migrations/001_init.sql)
```

## 2. 프로덕션 목표 구성 (전환 계획)
```
[Next.js/React + Tailwind]  ── Vercel(또는 자체 호스팅)
      │
      ├─ Supabase Auth        (JWT, MAU)
      ├─ Supabase Postgres    (RLS 정책 = 참조 MVP의 서버 판정 이관)
      ├─ Supabase Storage     (파일함, 서명 URL)
      └─ Supabase Realtime    (실시간 갱신 = 폴링 대체)
```
전환은 (1) 스키마 이식(`DATABASE.md` 5장) → (2) 서버 권한판정을 RLS로 이관(6장) →
(3) 인증을 Supabase Auth로 교체 → (4) 파일함/실시간 추가 순.

## 3. 인증 흐름
로그인 → scrypt 검증 → `sessions` 발급 → httpOnly 쿠키 → 매 요청 `currentUser()`가
세션 만료·계정 정지·삭제 여부 재검증 → `ctx.user`(권한 Set 포함) 주입.

## 4. 권한 검증 흐름
라우트 테이블의 `perm` → `requirePermission`(라우터) → 통과 시 핸들러 →
핸들러 내 공개범위/부서/목적 2차 판정 → 거부 시 403 + `access.denied` 감사 로그.

## 5. 파일 업로드 흐름 (프로덕션 예정)
클라이언트 → 서버 권한검증 → Storage 업로드(서버 생성 키) → `files/file_versions` 메타 기록 →
다운로드는 권한 재검증 후 짧은 만료 서명 URL 발급.

## 6. 개인정보 조회 흐름
목록(마스킹) → 상세 요청(목적 포함) → `member.pii.read` 검증 → 원문 반환 직전
`personal_data_access_logs` 기록 → 감사자/개인정보관리자가 열람이력 조회.

## 7. 감사 로그 흐름
보호 동작마다 `logActivity()` append. 쓰기 전용(수정/삭제 API 없음) → 무결성 보장.
개인정보 접근은 별도 테이블로 분리 보관.

## 8. 동시성 모델
업무일지는 **낙관적 잠금**(`version` 컬럼 + `WHERE version=?`). 여러 사용자가 서로 다른
항목을 동시에 수정 가능하고, 동일 항목 충돌은 409로 감지해 사용자에게 최신 확인을 유도.
문자 단위 공동편집(구글닥스급)은 MVP 범위 밖으로 명시.
