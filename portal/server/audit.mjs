// 감사 로그 기록. 쓰기 전용 헬퍼 — 일반 사용자에게 수정/삭제 API를 제공하지 않음.
import crypto from 'node:crypto';
import { db } from './db.mjs';

export function logActivity({ actor_id, actor_email, action, entity_type, entity_id, detail, ip, user_agent }) {
  db.prepare(
    `INSERT INTO activity_logs(id,actor_id,actor_email,action,entity_type,entity_id,detail,ip,user_agent)
     VALUES(?,?,?,?,?,?,?,?,?)`
  ).run(
    crypto.randomUUID(), actor_id || null, actor_email || null, action,
    entity_type || null, entity_id || null,
    detail ? JSON.stringify(detail) : null, ip || null, user_agent || null
  );
}

// 개인정보 열람/변경 이력(별도 테이블)
export function logPersonalDataAccess({ actor_id, actor_email, member_id, member_name, fields, purpose, action, ip, user_agent }) {
  db.prepare(
    `INSERT INTO personal_data_access_logs(id,actor_id,actor_email,member_id,member_name,fields,purpose,action,ip,user_agent)
     VALUES(?,?,?,?,?,?,?,?,?,?)`
  ).run(
    crypto.randomUUID(), actor_id, actor_email || null, member_id, member_name || null,
    fields ? JSON.stringify(fields) : null, purpose || null, action || 'view', ip || null, user_agent || null
  );
}
