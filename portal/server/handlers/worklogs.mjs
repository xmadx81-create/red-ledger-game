import { db } from '../db.mjs';
import { uuid } from '../auth.mjs';
import { logActivity } from '../audit.mjs';
import { badRequest, notFound, conflict, forbidden, str, oneOf } from '../http-lib.mjs';
import { canSeeWorkLog, workLogScopeSql } from '../scope.mjs';
import { VISIBILITY_LABELS } from '../rbac.mjs';

const STATUSES = ['planned', 'in_progress', 'review', 'hold', 'done', 'canceled'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const VISIBILITIES = Object.keys(VISIBILITY_LABELS);

export const workLogHandlers = {
  // GET /api/work-logs?status=&department_id=&q=  (권한/공개범위로 서버에서 필터)
  list: (ctx) => {
    const scope = workLogScopeSql(ctx.user);
    const conds = [scope.where];
    const params = [...scope.params];
    if (ctx.query.status) { conds.push('status=?'); params.push(ctx.query.status); }
    if (ctx.query.department_id) { conds.push('department_id=?'); params.push(ctx.query.department_id); }
    if (ctx.query.assignee_id) { conds.push('assignee_id=?'); params.push(ctx.query.assignee_id); }
    if (ctx.query.q) { conds.push('(title LIKE ? OR content LIKE ?)'); params.push(`%${ctx.query.q}%`, `%${ctx.query.q}%`); }
    const rows = db.prepare(`
      SELECT w.*, d.name AS dept_name, a.full_name AS assignee_name, c.full_name AS author_name
      FROM work_logs w
      LEFT JOIN departments d ON d.id=w.department_id
      LEFT JOIN users a ON a.id=w.assignee_id
      LEFT JOIN users c ON c.id=w.created_by
      WHERE ${conds.join(' AND ')} ORDER BY w.work_date DESC, w.created_at DESC LIMIT 500`).all(...params);
    return { work_logs: rows };
  },

  get: (ctx) => {
    const w = db.prepare('SELECT * FROM work_logs WHERE id=? AND deleted_at IS NULL').get(ctx.params.id);
    if (!w) throw notFound('업무일지를 찾을 수 없습니다.');
    if (!canSeeWorkLog(ctx.user, w)) throw forbidden('이 업무일지를 열람할 권한이 없습니다.');
    return { work_log: w };
  },

  create: (ctx) => {
    const b = ctx.body;
    const title = str(b.title, { required: true, name: '업무 제목' });
    const id = uuid();
    // 작성자는 자신의 부서로 기본 설정(부서장/관리자는 지정 가능)
    let dept = str(b.department_id) || ctx.user.department_id || null;
    if (dept !== ctx.user.department_id && !ctx.user.has('work_log.read_all') && ctx.user.role_id !== 'dept_head') {
      dept = ctx.user.department_id || null;
    }
    db.prepare(`INSERT INTO work_logs(id,title,content,category,status,priority,department_id,assignee_id,
                work_date,start_date,due_date,issues,actions,next_plan,visibility,version,created_by,updated_by)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`)
      .run(id, title, str(b.content, { max: 20000 }), str(b.category), oneOf(b.status, STATUSES, '진행 상태') || 'planned',
           oneOf(b.priority, PRIORITIES, '우선순위') || 'normal', dept, str(b.assignee_id) || null,
           str(b.work_date) || new Date().toISOString().slice(0, 10), str(b.start_date), str(b.due_date),
           str(b.issues, { max: 20000 }), str(b.actions, { max: 20000 }), str(b.next_plan, { max: 20000 }),
           oneOf(b.visibility, VISIBILITIES, '공개 범위') || 'department', ctx.user.id, ctx.user.id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'work_log.create', entity_type: 'work_logs', entity_id: id, ...ctx.meta });
    return { ok: true, id };
  },

  // 낙관적 잠금: 클라이언트가 보낸 version 이 현재와 다르면 409 충돌
  update: (ctx) => {
    const id = ctx.params.id;
    const w = db.prepare('SELECT * FROM work_logs WHERE id=? AND deleted_at IS NULL').get(id);
    if (!w) throw notFound('업무일지를 찾을 수 없습니다.');
    if (!canSeeWorkLog(ctx.user, w)) throw forbidden('이 업무일지를 수정할 권한이 없습니다.');
    // 작성자·담당자·부서장·관리자만 수정
    const canEdit = w.created_by === ctx.user.id || w.assignee_id === ctx.user.id ||
      ctx.user.has('work_log.read_all') || (ctx.user.role_id === 'dept_head' && ctx.user.department_id === w.department_id);
    if (!canEdit) throw forbidden('작성자·담당자·부서장만 수정할 수 있습니다.');
    const clientVersion = Number(ctx.body.version);
    if (!clientVersion) throw badRequest('버전 정보가 없습니다. 새로고침 후 다시 시도해 주세요.');
    if (clientVersion !== w.version) {
      throw conflict(`다른 사용자가 이미 수정했습니다(현재 버전 ${w.version}). 최신 내용을 확인한 뒤 다시 저장해 주세요.`);
    }
    const b = ctx.body;
    const fields = {
      title: str(b.title, { name: '업무 제목' }) ?? w.title,
      content: b.content !== undefined ? str(b.content, { max: 20000 }) : w.content,
      category: b.category !== undefined ? str(b.category) : w.category,
      status: b.status !== undefined ? (oneOf(b.status, STATUSES, '진행 상태') || w.status) : w.status,
      priority: b.priority !== undefined ? (oneOf(b.priority, PRIORITIES, '우선순위') || w.priority) : w.priority,
      assignee_id: b.assignee_id !== undefined ? (str(b.assignee_id) || null) : w.assignee_id,
      due_date: b.due_date !== undefined ? str(b.due_date) : w.due_date,
      issues: b.issues !== undefined ? str(b.issues, { max: 20000 }) : w.issues,
      actions: b.actions !== undefined ? str(b.actions, { max: 20000 }) : w.actions,
      next_plan: b.next_plan !== undefined ? str(b.next_plan, { max: 20000 }) : w.next_plan,
      visibility: b.visibility !== undefined ? (oneOf(b.visibility, VISIBILITIES, '공개 범위') || w.visibility) : w.visibility,
    };
    const info = db.prepare(`UPDATE work_logs SET title=?,content=?,category=?,status=?,priority=?,assignee_id=?,
        due_date=?,issues=?,actions=?,next_plan=?,visibility=?, version=version+1,
        updated_at=datetime('now'), updated_by=? WHERE id=? AND version=?`)
      .run(fields.title, fields.content, fields.category, fields.status, fields.priority, fields.assignee_id,
           fields.due_date, fields.issues, fields.actions, fields.next_plan, fields.visibility, ctx.user.id, id, clientVersion);
    if (info.changes === 0) throw conflict('저장 중 다른 변경이 감지되었습니다. 새로고침 후 다시 시도해 주세요.');
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'work_log.update', entity_type: 'work_logs', entity_id: id, detail: { from_version: clientVersion }, ...ctx.meta });
    return { ok: true, version: clientVersion + 1 };
  },

  approve: (ctx) => {
    const id = ctx.params.id;
    const w = db.prepare('SELECT * FROM work_logs WHERE id=? AND deleted_at IS NULL').get(id);
    if (!w) throw notFound();
    if (!(ctx.user.has('work_log.approve') && (ctx.user.has('work_log.read_all') || ctx.user.department_id === w.department_id)))
      throw forbidden('승인 권한이 없습니다.');
    db.prepare("UPDATE work_logs SET status='done', done_date=date('now'), version=version+1, updated_at=datetime('now'), updated_by=? WHERE id=?").run(ctx.user.id, id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'work_log.approve', entity_type: 'work_logs', entity_id: id, ...ctx.meta });
    return { ok: true };
  },

  // 소프트 삭제(복구 가능)
  remove: (ctx) => {
    const id = ctx.params.id;
    const w = db.prepare('SELECT * FROM work_logs WHERE id=? AND deleted_at IS NULL').get(id);
    if (!w) throw notFound();
    const canDel = w.created_by === ctx.user.id || ctx.user.has('work_log.read_all') ||
      (ctx.user.role_id === 'dept_head' && ctx.user.department_id === w.department_id);
    if (!canDel) throw forbidden('작성자·부서장·관리자만 삭제할 수 있습니다.');
    db.prepare("UPDATE work_logs SET deleted_at=datetime('now'), is_active=0, updated_by=? WHERE id=?").run(ctx.user.id, id);
    logActivity({ actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'work_log.delete', entity_type: 'work_logs', entity_id: id, ...ctx.meta });
    return { ok: true };
  },
};
