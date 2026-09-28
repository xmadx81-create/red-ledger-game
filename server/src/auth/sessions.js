import crypto from 'node:crypto';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/; // 32바이트 난수의 base64url 표현

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isWellFormed(token) {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

/**
 * DB 기반 세션 저장소.
 * - 토큰은 추측 불가능한 32바이트 난수이며 DB에는 SHA-256 해시만 저장한다.
 * - 슬라이딩 만료: 남은 기간이 절반 이하로 줄면 ttl만큼 연장하되, 최초 발급 후 absoluteTtl을 넘기지 않는다.
 */
export function createSessionStore(db, { ttlMs, absoluteTtlMs, now = Date.now }) {
  const insertStmt = db.prepare(
    'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  );
  const findStmt = db.prepare(`
    SELECT s.user_id, s.created_at, s.expires_at, u.name, u.email
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `);
  const extendStmt = db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?');
  const deleteStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const purgeStmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');

  return {
    create(userId) {
      const token = crypto.randomBytes(32).toString('base64url');
      const createdAt = now();
      const expiresAt = createdAt + ttlMs;
      insertStmt.run(hashToken(token), userId, createdAt, expiresAt);
      return { token, expiresAt };
    },

    /** 유효한 세션이면 { user, expiresAt, renewed }, 아니면 null. 만료된 세션은 이 시점에 삭제한다. */
    validate(token) {
      if (!isWellFormed(token)) return null;
      const id = hashToken(token);
      const row = findStmt.get(id);
      if (!row) return null;

      const current = now();
      if (row.expires_at <= current) {
        deleteStmt.run(id);
        return null;
      }

      let expiresAt = row.expires_at;
      let renewed = false;
      if (expiresAt - current < ttlMs / 2) {
        const extended = Math.min(current + ttlMs, row.created_at + absoluteTtlMs);
        if (extended > expiresAt) {
          expiresAt = extended;
          renewed = true;
          extendStmt.run(expiresAt, id);
        }
      }

      return {
        user: { id: row.user_id, name: row.name, email: row.email },
        expiresAt,
        renewed,
      };
    },

    revoke(token) {
      if (isWellFormed(token)) deleteStmt.run(hashToken(token));
    },

    purgeExpired() {
      return purgeStmt.run(now()).changes;
    },
  };
}
