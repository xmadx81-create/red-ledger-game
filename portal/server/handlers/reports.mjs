import { db } from '../db.mjs';
import { statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.EBTS_DB_PATH || join(__dirname, '..', '..', 'data', 'ebts.db');

export const reportHandlers = {
  // 감사 로그(일반 활동) — audit.read 필요
  activityLogs: (ctx) => {
    const params = [];
    const conds = [];
    if (ctx.query.action) { conds.push('action=?'); params.push(ctx.query.action); }
    if (ctx.query.actor_id) { conds.push('actor_id=?'); params.push(ctx.query.actor_id); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const rows = db.prepare(`SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT 300`).all(...params);
    return { logs: rows };
  },

  // 개인정보 열람이력 — audit.pii.read 필요
  piiAccessLogs: (ctx) => {
    const rows = db.prepare('SELECT * FROM personal_data_access_logs ORDER BY created_at DESC LIMIT 300').all();
    return { logs: rows };
  },

  // 사용량/저장공간 — usage.read 필요
  usage: () => {
    const count = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t} WHERE deleted_at IS NULL`).get().c;
    const rawCount = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
    let dbBytes = 0;
    try { if (existsSync(DB_PATH)) dbBytes = statSync(DB_PATH).size; } catch {}
    const activeUsers = db.prepare("SELECT COUNT(*) c FROM users WHERE deleted_at IS NULL AND status='active'").get().c;
    const monthlyActive = db.prepare("SELECT COUNT(*) c FROM users WHERE last_login_at >= datetime('now','-30 days')").get().c;
    return {
      users: count('users'), active_users: activeUsers, monthly_active_users: monthlyActive,
      departments: count('departments'), work_logs: count('work_logs'), members: count('member_profiles'),
      activity_logs: rawCount('activity_logs'), pii_access_logs: rawCount('personal_data_access_logs'),
      db_bytes: dbBytes, db_mb: +(dbBytes / 1024 / 1024).toFixed(2),
      // 무료 한도(Supabase Free 기준, 문서 COST_ESTIMATE.md 참조): DB 500MB, 스토리지 1GB
      db_free_limit_mb: 500, db_usage_pct: +((dbBytes / 1024 / 1024) / 500 * 100).toFixed(2),
      note: '파일 스토리지는 MVP 미구현. 클라우드 요금은 COST_ESTIMATE.md의 공식 출처 기준을 참조하세요.',
    };
  },

  // 대시보드 — 권한에 따라 노출 항목이 달라짐
  dashboard: (ctx) => {
    const u = ctx.user;
    const out = { greeting: u.full_name, role_id: u.role_id, cards: {} };
    if (u.has('work_log.read')) {
      // 본인 담당 미완료 업무
      out.cards.my_open = db.prepare("SELECT COUNT(*) c FROM work_logs WHERE assignee_id=? AND status NOT IN('done','canceled') AND deleted_at IS NULL").get(u.id).c;
      out.cards.my_recent = db.prepare(`SELECT id,title,status,work_date FROM work_logs WHERE (created_by=? OR assignee_id=?) AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 5`).all(u.id, u.id);
    }
    if (u.has('work_log.approve') || u.has('work_log.read_all')) {
      out.cards.pending_review = db.prepare("SELECT COUNT(*) c FROM work_logs WHERE status='review' AND deleted_at IS NULL").get().c;
    }
    if (u.has('user.read')) out.cards.user_count = db.prepare("SELECT COUNT(*) c FROM users WHERE deleted_at IS NULL").get().c;
    if (u.has('member.read')) out.cards.member_count = db.prepare('SELECT COUNT(*) c FROM member_profiles WHERE deleted_at IS NULL').get().c;
    if (u.has('audit.read')) out.cards.recent_activity = db.prepare('SELECT action,actor_email,created_at FROM activity_logs ORDER BY created_at DESC LIMIT 8').all();
    return out;
  },
};
