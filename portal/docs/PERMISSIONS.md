# 권한 설계 및 권한표 (PERMISSIONS)

권한은 "관리자/일반" 2분법이 아니라 **역할 × 부서 × 공개범위 × 작업종류**를 조합합니다.
권한의 단일 원천은 `portal/server/rbac.mjs` 이며, 모든 보호된 API가 이를 서버에서 강제합니다.
화면의 버튼 숨김은 편의일 뿐이며, **실제 통제는 서버 라우트의 `requirePermission` + 핸들러 내
공개범위/부서 판정**에서 이뤄집니다.

## 1. 세분화 권한(18종)
`user.read/manage`, `role.manage`, `dept.read/manage`,
`work_log.read/write/update/delete/approve/read_all`,
`member.read`(마스킹 목록), `member.pii.read`(원문 열람), `member.pii.write`(수정),
`audit.read`, `audit.pii.read`, `system.manage`, `usage.read`

## 2. 역할 × 권한 매트릭스 (기본값)

| 권한 \ 역할 | 최고관리자 | 개인정보관리자 | 부서장 | 부서원 | 감사·열람 | 일반조합원 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| user.read | ✅ | ✅ | ✅ | · | ✅ | · |
| user.manage | ✅ | · | · | · | · | · |
| role.manage | ✅ | · | · | · | · | · |
| dept.read | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| dept.manage | ✅ | · | · | · | · | · |
| work_log.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| work_log.write | ✅ | · | ✅ | ✅ | · | · |
| work_log.update | ✅ | · | ✅ | ✅ | · | · |
| work_log.delete | ✅ | · | ✅ | · | · | · |
| work_log.approve | ✅ | · | ✅ | · | · | · |
| work_log.read_all | ✅ | · | · | · | ✅ | · |
| member.read (마스킹) | ✅ | ✅ | ·¹ | ·¹ | ✅ | · |
| member.pii.read (원문) | ✅ | ✅ | · | · | · | · |
| member.pii.write | ✅ | ✅ | · | · | · | · |
| audit.read | ✅ | · | · | · | ✅ | · |
| audit.pii.read | ✅ | ✅ | · | · | ✅ | · |
| usage.read | ✅ | · | · | · | ✅ | · |
| system.manage | ✅ | · | · | · | · | · |

¹ 부서장·부서원의 개인정보 접근은 **기본 미포함**. 필요 시 관리자가 `member.read`(또는
`member.pii.read`)를 **개별 권한**(`user_permissions`)으로 부여해야만 조회 가능 —
요구사항 "부서원은 원칙적으로 조회 불가 / 부서장은 별도 권한 있을 때만"을 반영.

## 3. 유효 권한 계산
`effectivePermissions = 역할 권한(role_permissions) ∪ 개별 권한(user_permissions)`
(`portal/server/db.mjs`). 관리자는 화면 "역할·권한"에서 역할 권한을, "사용자 관리"에서
개별 권한을 조정할 수 있고 변경은 즉시 서버에 반영됩니다.

## 4. 업무일지 공개범위(visibility) 판정
`portal/server/scope.mjs`. 목록은 SQL WHERE로, 단건은 `canSeeWorkLog`로 이중 강제.
- `all/staff/members` → `work_log.read` 보유자 조회 가능
- `department` → 같은 부서만 (+ 작성자/담당자/`read_all` 예외)
- `author_admin` → 작성자와 `read_all` 보유자만
- 작성자·담당자는 공개범위와 무관하게 본인 관련 항목 조회 가능

## 5. 개인정보 접근 규칙 (가장 엄격)
1. 목록(`GET /api/members`)은 `member.read` 필요 + **항상 마스킹**(이름/연락처/생년월일/이메일/주소).
2. 원문 상세(`GET /api/members/:id`)는 `member.pii.read` 필요 **및 열람 목적(purpose) 필수**.
   목적 없이 호출하면 400. 성공 시 `personal_data_access_logs`에 조회자·대상·항목·목적·시각 기록.
3. 수정(`member.pii.write`)도 열람이력에 `action=update`로 기록.
4. 권한 없는 사용자가 API 주소를 직접 호출해도 403 — 화면 숨김에 의존하지 않음.

## 6. 권한 테스트 결과 (자동화 검증, `npm run portal:test`)
서버를 실제로 띄우고 HTTP로 호출하는 통합 테스트 **30개 전부 통과** (2026-07-14 기준).
핵심 검증 항목:

- ✅ 비로그인 사용자의 보호 API 접근 401
- ✅ 부서원의 사용자목록/인적사항목록 접근 403 (권한 없음)
- ✅ 정지 계정 로그인 차단, 잘못된 비밀번호 401, 로그인 실패 누적 잠금
- ✅ 인적사항 목록 마스킹 / 목적 없는 상세 400 / 목적 입력 후 원문 200
- ✅ 감사자(pii.read 없음)의 개인정보 원문 열람 403
- ✅ 개인정보 열람 시 열람이력 기록 확인
- ✅ 석유사업부원은 전략기획실 부서전용 업무일지를 못 봄 (공개범위 강제)
- ✅ 낡은 version으로 수정 시 409 충돌 감지 (낙관적 잠금)
- ✅ 부서원 삭제 불가(403) / 부서장 소프트삭제 성공
- ✅ 대시보드 권한 필터(조합원에게 사용자수·인적사항수 미노출)
- ✅ 로그아웃 후 세션 무효화(401), 계정 정지 시 활성 세션 즉시 종료

브라우저 UI 흐름 테스트(`portal/tests/ui-test.mjs`) 11개도 전부 통과.
