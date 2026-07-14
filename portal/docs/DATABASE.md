# 데이터베이스 설계 (DATABASE)

- 참조 MVP: **SQLite**(`portal/data/ebts.db`, `node:sqlite`)
- 프로덕션 목표: **PostgreSQL / Supabase** (스키마 이식 가능하게 설계)
- 스키마 원본: `portal/migrations/001_init.sql`

## 1. 공통 컬럼 규칙
주요 업무 테이블은 `id, created_at, created_by, updated_at, updated_by, deleted_at,
is_active, organization_id`를 둡니다. 삭제는 물리 삭제 대신 `deleted_at`을 채우는
**소프트 삭제**를 우선하며, 조회 쿼리는 `deleted_at IS NULL`로 필터합니다.
`organization_id`(기본 `org_1`)로 향후 멀티조직 분리가 가능하되 초기엔 단일 조직으로 운영합니다.

## 2. 테이블 목록 (구현)
| 테이블 | 용도 |
|---|---|
| organizations | 조직(멀티테넌시 대비) |
| roles / permissions / role_permissions | 역할·권한과 매핑 |
| user_permissions | 사용자 개별 권한(역할 위에 가산) |
| departments / positions | 부서(계층·부서장) / 직책 |
| users | 인증 주체. `password_hash`(scrypt), 상태·로그인실패·잠금·최종로그인 |
| sessions | 로그인 세션(토큰=PK, 만료·폐기) |
| work_logs | 업무일지(상태·우선순위·공개범위·`version` 낙관적잠금) |
| member_profiles | 조합원/임직원 인적사항(개인정보) |
| activity_logs | 감사 로그(일반 활동, 쓰기 전용) |
| personal_data_access_logs | 개인정보 열람/변경 이력(별도 분리) |
| system_settings | 시스템 설정 키-값 |

> 요구사항의 `profiles, notices, tasks, task_*, manuals, manual_versions, files,
> file_versions, file_permissions, member_change_requests, notifications` 등은 스키마 확장
> 지점을 문서화만 하고 MVP에서는 미생성(→ `ROADMAP_UNDONE.md`). 확장 시 동일한 공통 컬럼
> 규칙과 RLS 패턴을 따릅니다.

## 3. 주요 관계 (ERD 개념)
```
organizations 1─* roles ─* role_permissions *─ permissions
users *─1 roles,  users *─1 departments,  users *─1 positions
users 1─* user_permissions *─1 permissions
users 1─* sessions
departments 1─* users (부서원),  departments.head_user_id ─1 users (부서장)
work_logs *─1 departments,  work_logs *─1 users(assignee/created_by)
member_profiles 1─* personal_data_access_logs (member_id)
users 1─* activity_logs (actor_id),  users 1─* personal_data_access_logs (actor_id)
```

## 4. 주요 데이터 흐름
- **인증:** 로그인 → `verifyPassword`(scrypt) → `sessions` 발급 → httpOnly 쿠키 → 매 요청 `currentUser`로 세션·정지·만료 검증.
- **업무일지 수정(동시성):** 클라이언트가 `version`을 보내면 `UPDATE ... WHERE id=? AND version=?`.
  변경행 0이면 409(다른 사용자가 먼저 수정) → 사용자에게 최신 확인 안내.
- **개인정보 열람:** 목록=마스킹, 상세=`member.pii.read` + 목적 필수 → 반환 직전
  `personal_data_access_logs` 기록(조회자/대상/항목/목적/시각/접속환경).
- **감사 로그:** 로그인·사용자/부서/역할 변경·업무일지 CRUD·개인정보 접근·권한거부(`access.denied`)를
  `activity_logs`에 append. 수정/삭제 API 없음.

## 5. SQLite → PostgreSQL 이식 매핑
| SQLite | PostgreSQL |
|---|---|
| `TEXT PRIMARY KEY`(UUID 문자열) | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` |
| `datetime('now')` | `now()` / `timestamptz DEFAULT now()` |
| `INTEGER`(0/1 불리언) | `boolean` |
| `date('now')` | `current_date` |
| 앱 레벨 권한강제 | **RLS 정책**으로 이관(아래) |

## 6. PostgreSQL RLS 정책 (프로덕션 전환 시)
참조 MVP의 서버 판정 로직은 그대로 RLS로 옮길 수 있습니다. 예시:
```sql
-- 개인정보: pii.read 권한 보유자만 원문 SELECT
alter table member_profiles enable row level security;
create policy pii_read on member_profiles for select
  using ( auth_has_permission('member.pii.read') );   -- JWT 클레임/함수로 판정

-- 업무일지: 공개범위 + 본인/부서 조건
create policy worklog_read on work_logs for select using (
  deleted_at is null and (
    auth_has_permission('work_log.read_all')
    or created_by = auth.uid() or assignee_id = auth.uid()
    or visibility in ('all','staff','members')
    or (visibility = 'department' and department_id = auth_department_id())
  )
);
```
열람이력·감사 로그는 트리거 또는 Edge Function에서 기록합니다.

## 7. 백업/복구
- 참조 MVP: SQLite 파일 + WAL. 파일 복사로 백업, `.backup` 명령 권장.
- 프로덕션: Supabase 자동 백업(Pro 이상 PITR 옵션) — `SECURITY.md`/`DEPLOYMENT.md` 참조.
