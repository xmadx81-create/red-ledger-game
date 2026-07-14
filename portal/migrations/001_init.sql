-- EBTS 통합업무포털 — 초기 스키마 (SQLite / node:sqlite)
-- 이 스키마는 프로덕션 목표인 PostgreSQL(Supabase)로 이식 가능하도록 설계되었습니다.
-- 자세한 매핑은 portal/docs/DATABASE.md 를 참고하세요.
--
-- 공통 컬럼 규칙: id, created_at, created_by, updated_at, updated_by, deleted_at, is_active, organization_id
-- 삭제는 물리 삭제 대신 deleted_at 을 채우는 소프트 삭제를 우선합니다.

PRAGMA foreign_keys = ON;

-- 조직(멀티테넌시 대비, 초기에는 단일 조직 org_1)
CREATE TABLE IF NOT EXISTS organizations (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- 역할(role): 확장 가능. 최고관리자가 역할 추가/수정 가능
CREATE TABLE IF NOT EXISTS roles (
  id            TEXT PRIMARY KEY,          -- 예: super_admin, privacy_officer, dept_head, dept_member, member, auditor
  name          TEXT NOT NULL,             -- 한글 표시명
  description   TEXT,
  is_system     INTEGER NOT NULL DEFAULT 0,-- 시스템 기본 역할(삭제 금지)
  rank          INTEGER NOT NULL DEFAULT 100, -- 낮을수록 상위 권한
  organization_id TEXT NOT NULL DEFAULT 'org_1',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- 권한(permission): 세분화된 능력 단위
CREATE TABLE IF NOT EXISTS permissions (
  id            TEXT PRIMARY KEY,          -- 예: user.manage, work_log.write, member.pii.read
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,             -- user, work_log, task, manual, file, member, audit, system
  description   TEXT
);

-- 역할-권한 매핑
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       TEXT NOT NULL REFERENCES roles(id),
  permission_id TEXT NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- 부서
CREATE TABLE IF NOT EXISTS departments (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  parent_id     TEXT REFERENCES departments(id),
  head_user_id  TEXT,                      -- 부서장 (users.id) — FK는 users 생성 후 앱에서 검증
  description   TEXT,
  organization_id TEXT NOT NULL DEFAULT 'org_1',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  created_by    TEXT,
  updated_at    TEXT,
  updated_by    TEXT,
  deleted_at    TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- 직책
CREATE TABLE IF NOT EXISTS positions (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  rank          INTEGER NOT NULL DEFAULT 100,
  organization_id TEXT NOT NULL DEFAULT 'org_1',
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- 사용자(인증 주체) — 비밀번호는 scrypt 해시로만 저장
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  email              TEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,        -- scrypt: salt:hash (평문 저장 금지)
  full_name          TEXT NOT NULL,
  phone              TEXT,
  role_id            TEXT NOT NULL REFERENCES roles(id),
  department_id      TEXT REFERENCES departments(id),
  position_id        TEXT REFERENCES positions(id),
  status             TEXT NOT NULL DEFAULT 'active', -- active | suspended | pending | resigned
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until       TEXT,                 -- 실패 누적 잠금 해제 시각
  last_login_at      TEXT,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  organization_id    TEXT NOT NULL DEFAULT 'org_1',
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  created_by         TEXT,
  updated_at         TEXT,
  updated_by         TEXT,
  deleted_at         TEXT,
  is_active          INTEGER NOT NULL DEFAULT 1
);

-- 사용자별 추가(개별) 권한 부여 — 역할 위에 얹는 세부 권한
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id       TEXT NOT NULL REFERENCES users(id),
  permission_id TEXT NOT NULL REFERENCES permissions(id),
  granted_by    TEXT,
  granted_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, permission_id)
);

-- 세션(로그인 유지). 토큰 해시만 저장
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,          -- 토큰(랜덤). 쿠키로 전달, httpOnly
  user_id       TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at    TEXT NOT NULL,
  ip            TEXT,
  user_agent    TEXT,
  revoked_at    TEXT
);

-- 업무일지
CREATE TABLE IF NOT EXISTS work_logs (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  content       TEXT,
  category      TEXT,                      -- 업무 구분
  status        TEXT NOT NULL DEFAULT 'planned', -- planned|in_progress|review|hold|done|canceled
  priority      TEXT NOT NULL DEFAULT 'normal',  -- low|normal|high|urgent
  department_id TEXT REFERENCES departments(id),
  assignee_id   TEXT REFERENCES users(id),
  work_date     TEXT,                      -- 작성일(업무일)
  start_date    TEXT,
  due_date      TEXT,
  done_date     TEXT,
  issues        TEXT,                      -- 문제점
  actions       TEXT,                      -- 조치사항
  next_plan     TEXT,                      -- 다음 진행계획
  visibility    TEXT NOT NULL DEFAULT 'department', -- 아래 문서 참조
  version       INTEGER NOT NULL DEFAULT 1,-- 낙관적 잠금
  organization_id TEXT NOT NULL DEFAULT 'org_1',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  created_by    TEXT,
  updated_at    TEXT,
  updated_by    TEXT,
  deleted_at    TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- 조합원/임직원 인적사항 (개인정보 — 접근통제 핵심)
-- 고위험 정보(주민등록번호/계좌/건강정보)는 MVP에서 수집하지 않음
CREATE TABLE IF NOT EXISTS member_profiles (
  id            TEXT PRIMARY KEY,
  mgmt_no       TEXT UNIQUE,               -- 고유 관리번호
  name          TEXT NOT NULL,
  member_type   TEXT,                      -- 조합원 | 임직원
  affiliation   TEXT,                      -- 소속
  position_title TEXT,                     -- 직책
  region_hq     TEXT,                      -- 지역본부
  branch        TEXT,                      -- 지부
  local_office  TEXT,                      -- 지국
  phone         TEXT,                      -- 민감: 목록에서 마스킹
  email         TEXT,
  birth_date    TEXT,                      -- 민감: 목록에서 마스킹
  join_date     TEXT,
  member_status TEXT DEFAULT 'active',
  address       TEXT,                      -- 민감
  duty          TEXT,
  note          TEXT,
  organization_id TEXT NOT NULL DEFAULT 'org_1',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  created_by    TEXT,
  updated_at    TEXT,
  updated_by    TEXT,
  deleted_at    TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- 감사 로그(일반 활동) — 일반 사용자는 수정/삭제 불가(앱에서 강제, 쓰기 API 없음)
CREATE TABLE IF NOT EXISTS activity_logs (
  id            TEXT PRIMARY KEY,
  actor_id      TEXT,                      -- 수행 사용자
  actor_email   TEXT,
  action        TEXT NOT NULL,             -- login.success, user.create, work_log.update ...
  entity_type   TEXT,                      -- users, work_logs, member_profiles ...
  entity_id     TEXT,
  detail        TEXT,                      -- JSON 문자열
  ip            TEXT,
  user_agent    TEXT,
  organization_id TEXT NOT NULL DEFAULT 'org_1',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 개인정보 열람/변경 이력 (별도 테이블로 분리 — 규정 대응)
CREATE TABLE IF NOT EXISTS personal_data_access_logs (
  id            TEXT PRIMARY KEY,
  actor_id      TEXT NOT NULL,             -- 조회 사용자
  actor_email   TEXT,
  member_id     TEXT NOT NULL,             -- 조회 대상 member_profiles.id
  member_name   TEXT,
  fields        TEXT,                      -- 조회한 항목(JSON 배열 문자열)
  purpose       TEXT,                      -- 조회 목적/사유
  action        TEXT NOT NULL DEFAULT 'view', -- view | update
  ip            TEXT,
  user_agent    TEXT,
  organization_id TEXT NOT NULL DEFAULT 'org_1',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 시스템 설정(키-값)
CREATE TABLE IF NOT EXISTS system_settings (
  key           TEXT PRIMARY KEY,
  value         TEXT,
  updated_at    TEXT,
  updated_by    TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_dept ON work_logs(department_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_status ON work_logs(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_pda_member ON personal_data_access_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_pda_actor ON personal_data_access_logs(actor_id);
