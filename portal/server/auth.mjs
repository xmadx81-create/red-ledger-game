// 인증: 비밀번호 해시(scrypt), 세션, 로그인 잠금
import crypto from 'node:crypto';
import { db, effectivePermissions } from './db.mjs';
import { logActivity } from './audit.mjs';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8시간
const MAX_FAILED = 5;                       // 로그인 실패 허용 횟수
const LOCK_MS = 1000 * 60 * 15;             // 15분 잠금

export function uuid() { return crypto.randomUUID(); }

// 비밀번호 해시: scrypt. 저장 형식 "scrypt$salt$hash"(hex). 평문 저장 금지.
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(plain), salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(plain, stored) {
  try {
    const [algo, saltHex, hashHex] = String(stored).split('$');
    if (algo !== 'scrypt') return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(plain), salt, expected.length);
    return crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}

// 로그인. 성공 시 세션 토큰 반환. 실패/잠금/정지 처리 포함.
export function login(email, password, ctx = {}) {
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL').get(String(email).toLowerCase().trim());
  if (!user) {
    logActivity({ actor_email: email, action: 'login.fail', detail: { reason: 'no_user' }, ...ctx });
    return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }
  const now = Date.now();
  if (user.locked_until && new Date(user.locked_until + 'Z').getTime() > now) {
    logActivity({ actor_id: user.id, actor_email: user.email, action: 'login.fail', detail: { reason: 'locked' }, ...ctx });
    return { ok: false, error: '로그인 시도가 많아 계정이 잠겼습니다. 잠시 후 다시 시도해 주세요.' };
  }
  if (user.status === 'suspended') {
    logActivity({ actor_id: user.id, actor_email: user.email, action: 'login.fail', detail: { reason: 'suspended' }, ...ctx });
    return { ok: false, error: '정지된 계정입니다. 관리자에게 문의하세요.' };
  }
  if (user.status === 'resigned' || user.is_active === 0) {
    return { ok: false, error: '비활성화된 계정입니다.' };
  }
  if (!verifyPassword(password, user.password_hash)) {
    const failed = user.failed_login_count + 1;
    const lock = failed >= MAX_FAILED ? new Date(now + LOCK_MS).toISOString().replace('T', ' ').slice(0, 19) : null;
    db.prepare('UPDATE users SET failed_login_count=?, locked_until=? WHERE id=?').run(failed, lock, user.id);
    logActivity({ actor_id: user.id, actor_email: user.email, action: 'login.fail', detail: { reason: 'bad_password', failed }, ...ctx });
    const left = MAX_FAILED - failed;
    return { ok: false, error: left > 0 ? `비밀번호가 올바르지 않습니다. (남은 시도 ${left}회)` : '로그인 실패가 누적되어 계정이 15분간 잠겼습니다.' };
  }
  // 성공
  db.prepare("UPDATE users SET failed_login_count=0, locked_until=NULL, last_login_at=datetime('now') WHERE id=?").run(user.id);
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(now + SESSION_TTL_MS).toISOString().replace('T', ' ').slice(0, 19);
  db.prepare('INSERT INTO sessions(id,user_id,expires_at,ip,user_agent) VALUES(?,?,?,?,?)')
    .run(token, user.id, expires, ctx.ip || null, ctx.user_agent || null);
  logActivity({ actor_id: user.id, actor_email: user.email, action: 'login.success', ...ctx });
  return { ok: true, token, user: publicUser(user) };
}

export function logout(token) {
  if (!token) return;
  db.prepare("UPDATE sessions SET revoked_at=datetime('now') WHERE id=?").run(token);
}

// 세션 토큰으로 현재 사용자 컨텍스트 조회(권한 포함). 만료/정지 검증.
export function currentUser(token) {
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE id=? AND revoked_at IS NULL').get(token);
  if (!s) return null;
  if (new Date(s.expires_at + 'Z').getTime() < Date.now()) return null;
  const user = db.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').get(s.user_id);
  if (!user || user.status === 'suspended' || user.is_active === 0) return null;
  const perms = effectivePermissions(user.id, user.role_id);
  return { ...publicUser(user), permissions: perms, has: (p) => perms.has(p) };
}

export function publicUser(u) {
  return {
    id: u.id, email: u.email, full_name: u.full_name, phone: u.phone,
    role_id: u.role_id, department_id: u.department_id, position_id: u.position_id,
    status: u.status, last_login_at: u.last_login_at, must_change_password: u.must_change_password,
  };
}
