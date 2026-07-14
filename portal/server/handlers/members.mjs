import { db } from '../db.mjs';
import { uuid } from '../auth.mjs';
import { logActivity, logPersonalDataAccess } from '../audit.mjs';
import { badRequest, notFound, forbidden, str } from '../http-lib.mjs';

// 민감 항목 마스킹 — 목록에서는 항상 마스킹된 값만 노출
function maskPhone(p) { if (!p) return null; return p.replace(/(\d{2,3})-?(\d{3,4})-?(\d{4})/, (m, a, b, c) => `${a}-****-${c}`); }
function maskBirth(b) { if (!b) return null; return String(b).slice(0, 4) + '-**-**'; }
function maskName(n) { if (!n) return null; return n.length <= 2 ? n[0] + '*' : n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]; }
function maskEmail(e) { if (!e) return null; const [u, d] = String(e).split('@'); if (!d) return e; return u.slice(0, 2) + '***@' + d; }
function maskAddr(a) { if (!a) return null; return String(a).split(' ').slice(0, 2).join(' ') + ' ***'; }

function maskedRow(m) {
  return {
    id: m.id, mgmt_no: m.mgmt_no, name: maskName(m.name), member_type: m.member_type,
    affiliation: m.affiliation, position_title: m.position_title, region_hq: m.region_hq,
    branch: m.branch, phone: maskPhone(m.phone), email: maskEmail(m.email),
    birth_date: maskBirth(m.birth_date), member_status: m.member_status, masked: true,
  };
}

export const memberHandlers = {
  // 목록: member.read 필요. 항상 마스킹.
  list: (ctx) => {
    const conds = ['deleted_at IS NULL'];
    const params = [];
    if (ctx.query.q) { conds.push('(name LIKE ? OR mgmt_no LIKE ? OR affiliation LIKE ?)'); params.push(`%${ctx.query.q}%`, `%${ctx.query.q}%`, `%${ctx.query.q}%`); }
    if (ctx.query.member_type) { conds.push('member_type=?'); params.push(ctx.query.member_type); }
    const rows = db.prepare(`SELECT * FROM member_profiles WHERE ${conds.join(' AND ')} ORDER BY name LIMIT 500`).all(...params);
    return { members: rows.map(maskedRow), can_view_pii: ctx.user.has('member.pii.read') };
  },

  // 상세(원문): member.pii.read 필요. 열람 목적(purpose) 필수. 개인정보 열람이력 기록.
  get: (ctx) => {
    if (!ctx.user.has('member.pii.read')) throw forbidden('개인정보 상세를 열람할 권한이 없습니다. 목록에서는 마스킹된 정보만 확인할 수 있습니다.');
    const purpose = str(ctx.query.purpose || ctx.body?.purpose, { max: 500 });
    if (!purpose) throw badRequest('개인정보 열람 목적(사유)을 입력해야 상세를 조회할 수 있습니다.');
    const m = db.prepare('SELECT * FROM member_profiles WHERE id=? AND deleted_at IS NULL').get(ctx.params.id);
    if (!m) throw notFound('대상을 찾을 수 없습니다.');
    // 개인정보 열람이력 기록 (필수)
    logPersonalDataAccess({
      actor_id: ctx.user.id, actor_email: ctx.user.email, member_id: m.id, member_name: m.name,
      fields: ['name', 'phone', 'birth_date', 'address', 'email'], purpose, action: 'view', ...ctx.meta,
    });
    return { member: m, masked: false };
  },

  create: (ctx) => {
    if (!ctx.user.has('member.pii.write')) throw forbidden('개인정보 등록 권한이 없습니다.');
    const name = str(ctx.body.name, { required: true, name: '이름' });
    const id = uuid();
    const b = ctx.body;
    db.prepare(`INSERT INTO member_profiles(id,mgmt_no,name,member_type,affiliation,position_title,region_hq,branch,local_office,
                phone,email,birth_date,join_date,member_status,address,duty,note,created_by,updated_by)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, str(b.mgmt_no) || 'M' + id.slice(0, 6), name, str(b.member_type), str(b.affiliation), str(b.position_title),
           str(b.region_hq), str(b.branch), str(b.local_office), str(b.phone), str(b.email), str(b.birth_date),
           str(b.join_date), str(b.member_status) || 'active', str(b.address), str(b.duty), str(b.note), ctx.user.id, ctx.user.id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'member.create', entity_type: 'member_profiles', entity_id: id, ...ctx.meta });
    return { ok: true, id };
  },

  update: (ctx) => {
    if (!ctx.user.has('member.pii.write')) throw forbidden('개인정보 수정 권한이 없습니다.');
    const id = ctx.params.id;
    const m = db.prepare('SELECT * FROM member_profiles WHERE id=? AND deleted_at IS NULL').get(id);
    if (!m) throw notFound();
    const allowed = ['mgmt_no', 'name', 'member_type', 'affiliation', 'position_title', 'region_hq', 'branch', 'local_office', 'phone', 'email', 'birth_date', 'join_date', 'member_status', 'address', 'duty', 'note'];
    const fields = {};
    for (const k of allowed) if (ctx.body[k] !== undefined) fields[k] = str(ctx.body[k]);
    const keys = Object.keys(fields);
    if (!keys.length) throw badRequest('변경할 내용이 없습니다.');
    db.prepare(`UPDATE member_profiles SET ${keys.map((k) => `${k}=?`).join(',')}, updated_at=datetime('now'), updated_by=? WHERE id=?`)
      .run(...keys.map((k) => fields[k]), ctx.user.id, id);
    logPersonalDataAccess({ actor_id: ctx.user.id, actor_email: ctx.user.email, member_id: id, member_name: m.name, fields: keys, purpose: str(ctx.body.purpose) || '정보 수정', action: 'update', ...ctx.meta });
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'member.update', entity_type: 'member_profiles', entity_id: id, detail: { fields: keys }, ...ctx.meta });
    return { ok: true };
  },
};
