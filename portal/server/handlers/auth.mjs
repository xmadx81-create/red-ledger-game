import { db } from '../db.mjs';
import { login, logout, hashPassword, verifyPassword, uuid, publicUser } from '../auth.mjs';
import { logActivity } from '../audit.mjs';
import { badRequest, unauthorized, str } from '../http-lib.mjs';

// 초기 관리자 존재 여부
function adminExists() {
  return db.prepare("SELECT COUNT(*) c FROM users WHERE role_id='super_admin' AND deleted_at IS NULL").get().c > 0;
}

export const authHandlers = {
  // GET /api/setup/status — 초기 관리자 설정 필요 여부
  setupStatus: () => ({ needsSetup: !adminExists() }),

  // POST /api/setup/admin — 최고관리자 최초 1회 생성(관리자 없을 때만)
  setupAdmin: (ctx) => {
    if (adminExists()) throw badRequest('이미 관리자가 존재합니다. 로그인해 주세요.');
    const email = str(ctx.body.email, { required: true, name: '이메일' }).toLowerCase();
    const password = str(ctx.body.password, { required: true, name: '비밀번호' });
    const full_name = str(ctx.body.full_name, { required: true, name: '이름' });
    if (password.length < 8) throw badRequest('비밀번호는 8자 이상이어야 합니다.');
    const id = uuid();
    db.prepare(`INSERT INTO users(id,email,password_hash,full_name,role_id,status,created_by)
                VALUES(?,?,?,?,'super_admin','active',?)`)
      .run(id, email, hashPassword(password), full_name, id);
    logActivity({ actor_id: id, actor_email: email, action: 'setup.admin_created', entity_type: 'users', entity_id: id, ...ctx.meta });
    return { ok: true };
  },

  logout: (ctx) => {
    logout(ctx.token);
    if (ctx.user) logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'logout', ...ctx.meta });
    return { ok: true };
  },

  // GET /api/me — 현재 로그인 사용자 + 권한 목록
  me: (ctx) => {
    if (!ctx.user) throw unauthorized();
    return { user: { ...ctx.user, permissions: undefined, has: undefined }, permissions: [...ctx.user.permissions] };
  },

  // POST /api/me/password — 본인 비밀번호 변경
  changePassword: (ctx) => {
    if (!ctx.user) throw unauthorized();
    const cur = str(ctx.body.current, { required: true, name: '현재 비밀번호' });
    const next = str(ctx.body.next, { required: true, name: '새 비밀번호' });
    if (next.length < 8) throw badRequest('새 비밀번호는 8자 이상이어야 합니다.');
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(ctx.user.id);
    if (!verifyPassword(cur, u.password_hash)) throw badRequest('현재 비밀번호가 올바르지 않습니다.');
    db.prepare("UPDATE users SET password_hash=?, must_change_password=0, updated_at=datetime('now'), updated_by=? WHERE id=?")
      .run(hashPassword(next), ctx.user.id, ctx.user.id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'password.change', entity_type: 'users', entity_id: ctx.user.id, ...ctx.meta });
    return { ok: true };
  },
};
