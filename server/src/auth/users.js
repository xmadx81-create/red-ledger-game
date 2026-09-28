export class EmailTakenError extends Error {
  constructor() {
    super('이미 가입된 이메일입니다.');
    this.name = 'EmailTakenError';
  }
}

export function createUserRepository(db, { now = Date.now } = {}) {
  const insertStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, created_at, updated_at)
    VALUES (@name, @email, @passwordHash, @timestamp, @timestamp)
    RETURNING id, name, email, created_at
  `);
  const findByEmailStmt = db.prepare(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?',
  );
  const updateHashStmt = db.prepare(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
  );

  const isoNow = () => new Date(now()).toISOString();

  return {
    /** 이메일은 호출 전에 normalizeEmail()로 정규화되어 있어야 한다. 중복이면 EmailTakenError. */
    create({ name, email, passwordHash }) {
      try {
        return insertStmt.get({ name, email, passwordHash, timestamp: isoNow() });
      } catch (error) {
        if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new EmailTakenError();
        throw error;
      }
    },

    findByEmail(email) {
      return findByEmailStmt.get(email) ?? null;
    },

    updatePasswordHash(id, passwordHash) {
      updateHashStmt.run(passwordHash, isoNow(), id);
    },
  };
}

/** 응답에 내보내도 되는 회원 정보만 추린다(비밀번호 해시 제외). */
export function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
