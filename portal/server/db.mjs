// DB 접근 계층 (node:sqlite)
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from './rbac.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.EBTS_DB_PATH || join(__dirname, '..', 'data', 'ebts.db');

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function migrate() {
  const sql = readFileSync(join(__dirname, '..', 'migrations', '001_init.sql'), 'utf8');
  db.exec(sql);
  seedRbac();
}

// 역할·권한은 코드가 원천이므로 항상 최신 상태로 upsert
function seedRbac() {
  db.exec("INSERT OR IGNORE INTO organizations(id,name) VALUES('org_1','EBTS')");
  const upPerm = db.prepare(
    'INSERT INTO permissions(id,name,category) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category'
  );
  for (const [id, name, category] of PERMISSIONS) upPerm.run(id, name, category);

  const upRole = db.prepare(
    'INSERT INTO roles(id,name,description,is_system,rank) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, rank=excluded.rank'
  );
  for (const r of ROLES) upRole.run(r.id, r.name, r.description, r.is_system, r.rank);

  // 시스템 역할의 기본 권한을 재적용(관리자가 커스텀 역할에 준 권한은 건드리지 않음)
  const delRp = db.prepare('DELETE FROM role_permissions WHERE role_id=?');
  const insRp = db.prepare('INSERT OR IGNORE INTO role_permissions(role_id,permission_id) VALUES(?,?)');
  for (const r of ROLES) {
    delRp.run(r.id);
    for (const pid of ROLE_PERMISSIONS[r.id] || []) insRp.run(r.id, pid);
  }
}

// 사용자의 유효 권한 = 역할 권한 ∪ 개별 부여 권한
export function effectivePermissions(userId, roleId) {
  const rows = db.prepare(
    `SELECT permission_id AS p FROM role_permissions WHERE role_id = ?
     UNION
     SELECT permission_id AS p FROM user_permissions WHERE user_id = ?`
  ).all(roleId, userId);
  return new Set(rows.map((r) => r.p));
}

export function nowIso() {
  return db.prepare("SELECT datetime('now') AS n").get().n;
}
