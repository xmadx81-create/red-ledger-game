// 업무일지 공개범위(visibility) 기반 접근 판정 — 서버에서 강제(RLS 대응)
import { db } from './db.mjs';

// 사용자가 특정 업무일지를 볼 수 있는가
export function canSeeWorkLog(user, log) {
  if (user.has('work_log.read_all')) return true;           // 전 부서 조회 권한
  if (log.created_by === user.id) return true;              // 본인 작성분
  if (log.assignee_id === user.id) return true;             // 본인 담당분
  switch (log.visibility) {
    case 'all':
    case 'staff':
    case 'members':
      return user.has('work_log.read');
    case 'department':
      return user.department_id && user.department_id === log.department_id;
    case 'author_admin':
      return false; // 위에서 작성자/read_all 처리됨
    default:
      return false;
  }
}

// 목록 조회용 WHERE 절 + 파라미터 (SQL Injection 방지: 항상 바인딩 파라미터 사용)
// prefix: 조인 쿼리에서 모호한 컬럼명을 피하기 위한 테이블 별칭(기본 'w.')
export function workLogScopeSql(user, prefix = 'w.') {
  const p = prefix;
  if (user.has('work_log.read_all')) return { where: `${p}deleted_at IS NULL`, params: [] };
  const params = [];
  const conds = [];
  conds.push(`${p}created_by = ?`); params.push(user.id);
  conds.push(`${p}assignee_id = ?`); params.push(user.id);
  conds.push(`${p}visibility IN ('all','staff','members')`);
  if (user.department_id) { conds.push(`(${p}visibility='department' AND ${p}department_id = ?)`); params.push(user.department_id); }
  return { where: `${p}deleted_at IS NULL AND (${conds.join(' OR ')})`, params };
}
