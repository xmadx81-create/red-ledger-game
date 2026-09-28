import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

// 순서대로 한 번씩만 적용되는 스키마 변경 목록. 이미 배포된 항목은 수정하지 말고 뒤에 추가한다.
// 적용 여부는 SQLite의 PRAGMA user_version 에 기록한다.
const MIGRATIONS = [
  `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL CHECK (length(trim(name)) > 0),
    -- 정규화된(앞뒤 공백 제거·소문자) 이메일만 저장되도록 CHECK로 강제하고,
    -- UNIQUE 제약으로 동시 가입 요청에서도 중복 가입을 막는다.
    email         TEXT    NOT NULL UNIQUE CHECK (email = lower(trim(email))),
    -- Argon2id 해시 문자열($argon2id$...). 평문·복호화 가능한 값은 저장하지 않는다.
    password_hash TEXT    NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
    created_at    TEXT    NOT NULL,
    updated_at    TEXT    NOT NULL
  ) STRICT;

  CREATE TABLE sessions (
    -- 세션 토큰의 SHA-256 해시. 원본 토큰은 브라우저 쿠키에만 있으므로 DB가 유출돼도 세션을 가로챌 수 없다.
    id         TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  ) STRICT;

  CREATE INDEX sessions_user_id_idx ON sessions (user_id);
  CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
  `,
];

function migrate(db) {
  const current = db.pragma('user_version', { simple: true });
  for (let version = current; version < MIGRATIONS.length; version += 1) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

/** 파일 경로 또는 ':memory:'(테스트용)를 받아 스키마가 적용된 DB 연결을 연다. */
export function openDatabase(filePath) {
  if (filePath !== ':memory:') fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  migrate(db);
  return db;
}
