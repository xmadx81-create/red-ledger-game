import { db } from '../db.mjs';
import { hashPassword, uuid, publicUser } from '../auth.mjs';
import { logActivity } from '../audit.mjs';
import { badRequest, notFound, conflict, forbidden, str, oneOf } from '../http-lib.mjs';
import { PERMISSIONS } from '../rbac.mjs';

const VALID_ROLES = () => db.prepare('SELECT id FROM roles WHERE is_active=1').all().map((r) => r.id);

export const adminHandlers = {
  // ── 사용자 ─────────────────────────────
  listUsers: (ctx) => {
    const rows = db.prepare(`
      SELECT u.id,u.email,u.full_name,u.phone,u.role_id,u.department_id,u.position_id,u.status,
             u.last_login_at,u.created_at, r.name AS role_name, d.name AS dept_name, p.name AS position_name
      FROM users u
      LEFT JOIN roles r ON r.id=u.role_id
      LEFT JOIN departments d ON d.id=u.department_id
      LEFT JOIN positions p ON p.id=u.position_id
      WHERE u.deleted_at IS NULL ORDER BY u.created_at DESC`).all();
    return { users: rows };
  },

  createUser: (ctx) => {
    const email = str(ctx.body.email, { required: true, name: '이메일' }).toLowerCase();
    const password = str(ctx.body.password, { required: true, name: '초기 비밀번호' });
    const full_name = str(ctx.body.full_name, { required: true, name: '이름' });
    const role_id = oneOf(ctx.body.role_id, VALID_ROLES(), '역할');
    if (!role_id) throw badRequest('역할을 선택해 주세요.');
    if (password.length < 8) throw badRequest('초기 비밀번호는 8자 이상이어야 합니다.');
    const exists = db.prepare('SELECT 1 FROM users WHERE email=? AND deleted_at IS NULL').get(email);
    if (exists) throw conflict('이미 사용 중인 이메일입니다.');
    const id = uuid();
    db.prepare(`INSERT INTO users(id,email,password_hash,full_name,phone,role_id,department_id,position_id,status,must_change_password,created_by)
                VALUES(?,?,?,?,?,?,?,?,?,1,?)`)
      .run(id, email, hashPassword(password), full_name, str(ctx.body.phone) || null,
           role_id, str(ctx.body.department_id) || null, str(ctx.body.position_id) || null,
           oneOf(ctx.body.status, ['active', 'pending', 'suspended'], '상태') || 'active', ctx.user.id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'user.create', entity_type: 'users', entity_id: id, detail: { email, role_id }, ...ctx.meta });
    return { ok: true, id };
  },

  updateUser: (ctx) => {
    const id = ctx.params.id;
    const u = db.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').get(id);
    if (!u) throw notFound('사용자를 찾을 수 없습니다.');
    const fields = {};
    if (ctx.body.full_name != null) fields.full_name = str(ctx.body.full_name, { name: '이름' });
    if (ctx.body.phone != null) fields.phone = str(ctx.body.phone);
    if (ctx.body.role_id != null) fields.role_id = oneOf(ctx.body.role_id, VALID_ROLES(), '역할');
    if (ctx.body.department_id !== undefined) fields.department_id = str(ctx.body.department_id) || null;
    if (ctx.body.position_id !== undefined) fields.position_id = str(ctx.body.position_id) || null;
    if (ctx.body.status != null) fields.status = oneOf(ctx.body.status, ['active', 'suspended', 'pending', 'resigned'], '상태');
    if (ctx.body.password) { if (String(ctx.body.password).length < 8) throw badRequest('비밀번호는 8자 이상이어야 합니다.'); fields.password_hash = hashPassword(ctx.body.password); }
    const keys = Object.keys(fields);
    if (!keys.length) throw badRequest('변경할 내용이 없습니다.');
    const set = keys.map((k) => `${k}=?`).join(', ') + ", updated_at=datetime('now'), updated_by=?";
    db.prepare(`UPDATE users SET ${set} WHERE id=?`).run(...keys.map((k) => fields[k]), ctx.user.id, id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'user.update', entity_type: 'users', entity_id: id, detail: { fields: keys }, ...ctx.meta });
    return { ok: true };
  },

  suspendUser: (ctx) => {
    const id = ctx.params.id;
    if (id === ctx.user.id) throw badRequest('본인 계정은 정지할 수 없습니다.');
    const u = db.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').get(id);
    if (!u) throw notFound();
    db.prepare("UPDATE users SET status='suspended', updated_at=datetime('now'), updated_by=? WHERE id=?").run(ctx.user.id, id);
    db.prepare('UPDATE sessions SET revoked_at=datetime(\'now\') WHERE user_id=? AND revoked_at IS NULL').run(id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'user.suspend', entity_type: 'users', entity_id: id, ...ctx.meta });
    return { ok: true };
  },

  deleteUser: (ctx) => {
    const id = ctx.params.id;
    if (id === ctx.user.id) throw badRequest('본인 계정은 삭제할 수 없습니다.');
    const u = db.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').get(id);
    if (!u) throw notFound();
    db.prepare("UPDATE users SET deleted_at=datetime('now'), is_active=0, status='resigned', updated_by=? WHERE id=?").run(ctx.user.id, id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'user.delete', entity_type: 'users', entity_id: id, ...ctx.meta });
    return { ok: true };
  },

  // 사용자 개별 권한 부여/회수
  setUserPermissions: (ctx) => {
    const id = ctx.params.id;
    const u = db.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').get(id);
    if (!u) throw notFound();
    const valid = new Set(PERMISSIONS.map((p) => p[0]));
    const perms = Array.isArray(ctx.body.permissions) ? ctx.body.permissions.filter((p) => valid.has(p)) : [];
    db.prepare('DELETE FROM user_permissions WHERE user_id=?').run(id);
    const ins = db.prepare('INSERT INTO user_permissions(user_id,permission_id,granted_by) VALUES(?,?,?)');
    for (const p of perms) ins.run(id, p, ctx.user.id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'permission.grant', entity_type: 'users', entity_id: id, detail: { permissions: perms }, ...ctx.meta });
    return { ok: true };
  },

  // ── 부서 ─────────────────────────────
  listDepartments: () => {
    const rows = db.prepare(`
      SELECT d.*, (SELECT COUNT(*) FROM users u WHERE u.department_id=d.id AND u.deleted_at IS NULL) AS member_count,
             h.full_name AS head_name
      FROM departments d LEFT JOIN users h ON h.id=d.head_user_id
      WHERE d.deleted_at IS NULL ORDER BY d.name`).all();
    return { departments: rows };
  },

  createDepartment: (ctx) => {
    const name = str(ctx.body.name, { required: true, name: '부서명' });
    const id = 'dept_' + uuid().slice(0, 8);
    db.prepare('INSERT INTO departments(id,name,parent_id,head_user_id,description,created_by) VALUES(?,?,?,?,?,?)')
      .run(id, name, str(ctx.body.parent_id) || null, str(ctx.body.head_user_id) || null, str(ctx.body.description) || null, ctx.user.id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'dept.create', entity_type: 'departments', entity_id: id, ...ctx.meta });
    return { ok: true, id };
  },

  updateDepartment: (ctx) => {
    const id = ctx.params.id;
    const d = db.prepare('SELECT * FROM departments WHERE id=? AND deleted_at IS NULL').get(id);
    if (!d) throw notFound();
    const fields = {};
    if (ctx.body.name != null) fields.name = str(ctx.body.name, { name: '부서명' });
    if (ctx.body.parent_id !== undefined) fields.parent_id = str(ctx.body.parent_id) || null;
    if (ctx.body.head_user_id !== undefined) fields.head_user_id = str(ctx.body.head_user_id) || null;
    if (ctx.body.description !== undefined) fields.description = str(ctx.body.description) || null;
    if (ctx.body.is_active != null) fields.is_active = ctx.body.is_active ? 1 : 0;
    const keys = Object.keys(fields);
    if (!keys.length) throw badRequest('변경할 내용이 없습니다.');
    db.prepare(`UPDATE departments SET ${keys.map((k) => `${k}=?`).join(',')}, updated_at=datetime('now'), updated_by=? WHERE id=?`)
      .run(...keys.map((k) => fields[k]), ctx.user.id, id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'dept.update', entity_type: 'departments', entity_id: id, ...ctx.meta });
    return { ok: true };
  },

  // ── 직책 ─────────────────────────────
  listPositions: () => ({ positions: db.prepare('SELECT * FROM positions WHERE is_active=1 ORDER BY rank').all() }),

  // ── 역할·권한 ─────────────────────────────
  listRoles: () => {
    const roles = db.prepare('SELECT * FROM roles WHERE is_active=1 ORDER BY rank').all();
    const rp = db.prepare('SELECT role_id,permission_id FROM role_permissions').all();
    const map = {};
    for (const r of rp) (map[r.role_id] ||= []).push(r.permission_id);
    return { roles: roles.map((r) => ({ ...r, permissions: map[r.id] || [] })), all_permissions: PERMISSIONS.map(([id, name, category]) => ({ id, name, category })) };
  },

  createRole: (ctx) => {
    const name = str(ctx.body.name, { required: true, name: '역할명' });
    const id = 'role_' + uuid().slice(0, 8);
    db.prepare('INSERT INTO roles(id,name,description,is_system,rank) VALUES(?,?,?,0,?)')
      .run(id, name, str(ctx.body.description) || null, Number(ctx.body.rank) || 100);
    setRolePerms(id, ctx.body.permissions);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'role.create', entity_type: 'roles', entity_id: id, ...ctx.meta });
    return { ok: true, id };
  },

  updateRolePermissions: (ctx) => {
    const id = ctx.params.id;
    const role = db.prepare('SELECT * FROM roles WHERE id=?').get(id);
    if (!role) throw notFound('역할을 찾을 수 없습니다.');
    setRolePerms(id, ctx.body.permissions);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'role.update_permissions', entity_type: 'roles', entity_id: id, detail: { count: (ctx.body.permissions || []).length }, ...ctx.meta });
    return { ok: true };
  },
};

function setRolePerms(roleId, permissions) {
  const valid = new Set(PERMISSIONS.map((p) => p[0]));
  const perms = Array.isArray(permissions) ? permissions.filter((p) => valid.has(p)) : [];
  db.prepare('DELETE FROM role_permissions WHERE role_id=?').run(roleId);
  const ins = db.prepare('INSERT OR IGNORE INTO role_permissions(role_id,permission_id) VALUES(?,?)');
  for (const p of perms) ins.run(roleId, p);
}
