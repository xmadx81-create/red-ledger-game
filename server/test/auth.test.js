import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import argon2 from 'argon2';
import { startTestServer, VALID_SIGNUP } from './helpers.js';

const DAY = 24 * 60 * 60 * 1000;

function countRows(db, table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
}

describe('회원가입', () => {
  let ctx;
  // 이 묶음은 한 IP에서 가입을 여러 번 하므로 IP당 가입 제한을 넉넉히 둔다(제한 자체는 '요청 보호'에서 검사).
  before(async () => (ctx = await startTestServer({ rateLimit: { signupsPerIp: 100 } })));
  after(() => ctx.close());

  test('가입하면 Argon2id 해시로 저장하고 바로 로그인 상태가 된다', async () => {
    const client = ctx.client();
    const res = await client.post('/api/auth/signup', VALID_SIGNUP);

    assert.equal(res.status, 201);
    assert.deepEqual(Object.keys(res.data.user).sort(), ['email', 'id', 'name']);
    assert.equal(res.data.user.email, 'hong@example.com');

    const cookie = res.setCookies.find((c) => c.startsWith('sid='));
    assert.ok(cookie, '세션 쿠키가 발급되어야 한다');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /Expires=/);

    const row = ctx.db.prepare('SELECT password_hash FROM users WHERE email = ?').get('hong@example.com');
    assert.match(row.password_hash, /^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
    assert.ok(!row.password_hash.includes(VALID_SIGNUP.password));

    // DB에는 토큰 원문이 아니라 해시만 저장된다.
    const token = client.cookies.get('sid');
    const session = ctx.db.prepare('SELECT id FROM sessions').get();
    assert.notEqual(session.id, token);

    const me = await client.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.data.user.name, '홍길동');
  });

  test('이메일 앞뒤 공백·대소문자와 이름 공백을 일관되게 정리한다', async () => {
    const res = await ctx.client().post('/api/auth/signup', {
      ...VALID_SIGNUP,
      name: '  김   하늘 ',
      email: '  Sky.Kim@Example.COM ',
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.user.email, 'sky.kim@example.com');
    assert.equal(res.data.user.name, '김 하늘');
  });

  test('서버에서도 입력값을 검증한다', async () => {
    const res = await ctx.client().post('/api/auth/signup', {
      name: '   ',
      email: 'not-an-email',
      password: 'short',
      passwordConfirm: 'different',
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, 'VALIDATION_FAILED');
    assert.deepEqual(Object.keys(res.data.error.fields).sort(), ['email', 'name', 'password', 'passwordConfirm']);

    const noSpecial = await ctx.client().post('/api/auth/signup', {
      ...VALID_SIGNUP,
      email: 'nospecial@example.com',
      password: 'Password1',
      passwordConfirm: 'Password1',
    });
    assert.equal(noSpecial.status, 400);
    assert.match(noSpecial.data.error.fields.password, /영문, 숫자, 특수문자/);

    const mismatch = await ctx.client().post('/api/auth/signup', {
      ...VALID_SIGNUP,
      email: 'mismatch@example.com',
      passwordConfirm: 'Passw0rd?',
    });
    assert.equal(mismatch.status, 400);
    assert.deepEqual(Object.keys(mismatch.data.error.fields), ['passwordConfirm']);
  });

  test('JSON이 아닌 요청과 깨진 JSON은 거절한다', async () => {
    const client = ctx.client();
    const form = await client.request('/api/auth/signup', {
      method: 'POST',
      body: 'name=a&email=b',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(form.status, 415);

    const broken = await client.request('/api/auth/signup', {
      method: 'POST',
      body: '{"name":',
      headers: { 'content-type': 'application/json' },
    });
    assert.equal(broken.status, 400);
    assert.equal(broken.data.error.code, 'BAD_REQUEST');
  });

  test('이미 가입된 이메일은 대소문자·공백이 달라도 거절한다', async () => {
    await ctx.client().post('/api/auth/signup', { ...VALID_SIGNUP, email: 'dup@example.com' });
    const res = await ctx.client().post('/api/auth/signup', { ...VALID_SIGNUP, email: ' DUP@Example.com ' });
    assert.equal(res.status, 409);
    assert.equal(res.data.error.code, 'EMAIL_TAKEN');
    assert.ok(res.data.error.fields.email);
  });

  test('같은 이메일로 동시에 가입해도 계정은 하나만 생긴다', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        ctx.client().post('/api/auth/signup', { ...VALID_SIGNUP, email: 'race@example.com' }),
      ),
    );
    const statuses = attempts.map((r) => r.status).sort();
    assert.deepEqual(statuses, [201, 409, 409, 409, 409]);
    const count = ctx.db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').get('race@example.com').n;
    assert.equal(count, 1);
  });
});

describe('DB 제약 조건', () => {
  let ctx;
  before(async () => (ctx = await startTestServer()));
  after(() => ctx.close());

  const insert = (email, hash = '$argon2id$v=19$m=19456,t=2,p=1$abc$def') =>
    ctx.db
      .prepare('INSERT INTO users (name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run('테스트', email, hash, 'now', 'now');

  test('이메일 UNIQUE 제약이 중복 저장을 막는다', () => {
    insert('unique@example.com');
    assert.throws(() => insert('unique@example.com'), { code: 'SQLITE_CONSTRAINT_UNIQUE' });
  });

  test('정규화되지 않은 이메일과 평문 비밀번호는 저장할 수 없다', () => {
    assert.throws(() => insert('Upper@Example.com'), { code: 'SQLITE_CONSTRAINT_CHECK' });
    assert.throws(() => insert(' space@example.com'), { code: 'SQLITE_CONSTRAINT_CHECK' });
    assert.throws(() => insert('plain@example.com', 'Passw0rd!'), { code: 'SQLITE_CONSTRAINT_CHECK' });
  });
});

describe('로그인·로그아웃', () => {
  let ctx;
  before(async () => {
    ctx = await startTestServer();
    await ctx.client().post('/api/auth/signup', VALID_SIGNUP);
  });
  after(() => ctx.close());

  test('대소문자가 다른 이메일로도 로그인되고, 로그인할 때마다 새 세션이 발급된다', async () => {
    const client = ctx.client();
    const first = await client.post('/api/auth/login', { email: ' HONG@example.com', password: 'Passw0rd!' });
    assert.equal(first.status, 200);
    assert.equal(first.data.user.name, '홍길동');
    const firstToken = client.cookies.get('sid');

    const second = await client.post('/api/auth/login', { email: 'hong@example.com', password: 'Passw0rd!' });
    assert.equal(second.status, 200);
    const secondToken = client.cookies.get('sid');
    assert.notEqual(secondToken, firstToken);

    // 이전 세션 토큰은 폐기되어 더 이상 쓸 수 없다(세션 고정 방지).
    const stale = ctx.client();
    stale.cookies.set('sid', firstToken);
    assert.equal((await stale.get('/api/auth/me')).status, 401);
  });

  test('틀린 비밀번호와 없는 이메일에 같은 오류를 돌려준다', async () => {
    const wrongPassword = await ctx.client().post('/api/auth/login', {
      email: 'hong@example.com',
      password: 'Wrong0rd!',
    });
    const unknownEmail = await ctx.client().post('/api/auth/login', {
      email: 'nobody@example.com',
      password: 'Passw0rd!',
    });
    for (const res of [wrongPassword, unknownEmail]) {
      assert.equal(res.status, 401);
      assert.equal(res.data.error.code, 'INVALID_CREDENTIALS');
      assert.equal(res.data.error.message, '이메일 또는 비밀번호가 올바르지 않습니다.');
      assert.equal(res.setCookies.length, 0);
    }
  });

  test('로그인 입력값 누락은 필드별로 알려 준다', async () => {
    const res = await ctx.client().post('/api/auth/login', { email: '', password: '' });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.data.error.fields).sort(), ['email', 'password']);
  });

  test('로그아웃하면 세션이 DB에서 삭제되고 쿠키가 지워진다', async () => {
    const client = ctx.client();
    await client.post('/api/auth/login', { email: 'hong@example.com', password: 'Passw0rd!' });
    const token = client.cookies.get('sid');
    const before = countRows(ctx.db, 'sessions');

    const res = await client.post('/api/auth/logout');
    assert.equal(res.status, 204);
    assert.ok(res.setCookies.some((c) => c.startsWith('sid=;')));
    assert.equal(client.cookies.has('sid'), false);
    assert.equal(countRows(ctx.db, 'sessions'), before - 1);

    // 지워진 토큰을 다시 보내도 인증되지 않는다.
    const replay = ctx.client();
    replay.cookies.set('sid', token);
    assert.equal((await replay.get('/api/auth/me')).status, 401);
    const replayPage = ctx.client();
    replayPage.cookies.set('sid', token);
    const page = await replayPage.get('/dashboard');
    assert.equal(page.status, 302);
    assert.equal(page.headers.get('location'), '/login?reason=expired');
  });

  test('보안 설정이 바뀐 옛 해시는 로그인 시 새 설정으로 다시 저장한다', async () => {
    const legacyHash = await argon2.hash('Legacy0rd!', { type: argon2.argon2id, memoryCost: 4096, timeCost: 3 });
    ctx.db
      .prepare('INSERT INTO users (name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run('옛회원', 'legacy@example.com', legacyHash, 'now', 'now');

    const res = await ctx.client().post('/api/auth/login', { email: 'legacy@example.com', password: 'Legacy0rd!' });
    assert.equal(res.status, 200);
    const { password_hash: stored } = ctx.db
      .prepare('SELECT password_hash FROM users WHERE email = ?')
      .get('legacy@example.com');
    assert.match(stored, /m=19456,p=1,t=2/);
  });
});

describe('화면 라우트', () => {
  let ctx;
  let member;
  before(async () => {
    ctx = await startTestServer();
    member = ctx.client();
    await member.post('/api/auth/signup', {
      ...VALID_SIGNUP,
      name: '<script>alert(1)</script>',
      email: 'xss@example.com',
    });
  });
  after(() => ctx.close());

  test('비로그인 사용자는 대시보드 대신 로그인 화면으로 이동한다', async () => {
    const anon = ctx.client();
    const dashboard = await anon.get('/dashboard');
    assert.equal(dashboard.status, 302);
    assert.equal(dashboard.headers.get('location'), '/login');
    assert.equal((await anon.get('/')).headers.get('location'), '/login');
    assert.equal((await anon.get('/login')).status, 200);
    assert.equal((await anon.get('/signup')).status, 200);
  });

  test('로그인 회원은 대시보드에서 이름을 보고, 로그인·가입 화면은 대시보드로 돌려보낸다', async () => {
    const page = await member.get('/dashboard');
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('cache-control'), 'no-store');
    assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
    // 이름은 HTML 이스케이프되어 스크립트로 실행되지 않는다.
    assert.ok(page.text.includes('&lt;script&gt;alert(1)&lt;/script&gt;님, 환영합니다!'));
    assert.ok(!page.text.includes('<script>alert(1)</script>'));
    assert.ok(page.text.includes('id="logout-button"'));

    assert.equal((await member.get('/login')).headers.get('location'), '/dashboard');
    assert.equal((await member.get('/signup')).headers.get('location'), '/dashboard');
    assert.equal((await member.get('/')).headers.get('location'), '/dashboard');
  });

  test('화면 템플릿 파일은 라우트를 거치지 않고 직접 열 수 없다', async () => {
    const anon = ctx.client();
    assert.equal((await anon.get('/dashboard.html')).status, 404);
    assert.equal((await anon.get('/assets/dashboard.html')).status, 404);
    assert.equal((await anon.get('/assets/auth.css')).status, 200);
    assert.equal((await anon.get('/shared/validation.js')).status, 200);
  });

  test('없는 API는 JSON 404를 돌려준다', async () => {
    const res = await ctx.client().get('/api/unknown');
    assert.equal(res.status, 404);
    assert.equal(res.data.error.code, 'NOT_FOUND');
  });
});

describe('요청 보호', () => {
  test('다른 사이트에서 보낸 로그인·로그아웃 요청은 거절한다', async () => {
    const ctx = await startTestServer();
    try {
      const member = ctx.client();
      await member.post('/api/auth/signup', VALID_SIGNUP);

      const evilOrigin = await ctx.client().post('/api/auth/login', VALID_SIGNUP, {
        headers: { origin: 'https://evil.example' },
      });
      assert.equal(evilOrigin.status, 403);
      assert.equal(evilOrigin.data.error.code, 'FORBIDDEN_ORIGIN');

      const crossSite = await ctx.client().post('/api/auth/login', VALID_SIGNUP, {
        headers: { 'sec-fetch-site': 'cross-site' },
      });
      assert.equal(crossSite.status, 403);

      const sameOrigin = await ctx.client().post(
        '/api/auth/login',
        { email: VALID_SIGNUP.email, password: VALID_SIGNUP.password },
        { headers: { origin: ctx.baseUrl, 'sec-fetch-site': 'same-origin' } },
      );
      assert.equal(sameOrigin.status, 200);

      const forcedLogout = await member.post('/api/auth/logout', undefined, {
        headers: { origin: 'https://evil.example' },
      });
      assert.equal(forcedLogout.status, 403);
      assert.equal((await member.get('/api/auth/me')).status, 200, '세션이 유지되어야 한다');
    } finally {
      await ctx.close();
    }
  });

  test('같은 IP에서 가입 요청이 너무 많으면 막는다', async () => {
    const ctx = await startTestServer({ rateLimit: { signupsPerIp: 2 } });
    try {
      const statuses = [];
      for (const email of ['a1@example.com', 'a2@example.com', 'a3@example.com']) {
        statuses.push((await ctx.client().post('/api/auth/signup', { ...VALID_SIGNUP, email })).status);
      }
      assert.deepEqual(statuses, [201, 201, 429]);
    } finally {
      await ctx.close();
    }
  });

  test('같은 계정으로 로그인 실패가 반복되면 일정 시간 로그인을 막는다', async () => {
    const ctx = await startTestServer({ rateLimit: { loginFailuresPerAccount: 3 } });
    try {
      await ctx.client().post('/api/auth/signup', VALID_SIGNUP);
      for (let i = 0; i < 3; i += 1) {
        const res = await ctx.client().post('/api/auth/login', { email: VALID_SIGNUP.email, password: 'Wrong0rd!' });
        assert.equal(res.status, 401);
      }
      const blocked = await ctx.client().post('/api/auth/login', {
        email: VALID_SIGNUP.email,
        password: VALID_SIGNUP.password,
      });
      assert.equal(blocked.status, 429);
      assert.equal(blocked.data.error.code, 'RATE_LIMITED');

      // 다른 계정은 영향을 받지 않는다.
      const other = await ctx.client().post('/api/auth/login', { email: 'other@example.com', password: 'x' });
      assert.equal(other.status, 401);
    } finally {
      await ctx.close();
    }
  });
});

describe('로그인 유지(세션 만료)', () => {
  test('7일간 접속이 없으면 만료되고, 접속하면 연장되며, 최초 로그인 30일 후에는 반드시 만료된다', async () => {
    let current = Date.now();
    const ctx = await startTestServer({ now: () => current });
    try {
      const client = ctx.client();
      await client.post('/api/auth/signup', VALID_SIGNUP);
      const startedAt = current;
      const expiresAt = () => ctx.db.prepare('SELECT expires_at FROM sessions').get()?.expires_at;
      assert.equal(expiresAt(), startedAt + 7 * DAY);

      // 남은 기간이 절반 이하가 된 뒤 접속하면 7일 연장 + 쿠키 갱신
      current += 4 * DAY;
      const renewed = await client.get('/api/auth/me');
      assert.equal(renewed.status, 200);
      assert.ok(renewed.setCookies.some((c) => c.startsWith('sid=')));
      assert.equal(expiresAt(), current + 7 * DAY);

      // 계속 접속해도 최초 로그인 후 30일을 넘길 수 없다.
      for (let day = 8; day <= 28; day += 4) {
        current = startedAt + day * DAY;
        assert.equal((await client.get('/api/auth/me')).status, 200);
      }
      assert.equal(expiresAt(), startedAt + 30 * DAY);
      current = startedAt + 30 * DAY + 1;
      assert.equal((await client.get('/api/auth/me')).status, 401);
      assert.equal(countRows(ctx.db, 'sessions'), 0);

      // 새로 로그인한 뒤 7일 넘게 접속하지 않으면 만료
      await client.post('/api/auth/login', { email: VALID_SIGNUP.email, password: VALID_SIGNUP.password });
      current += 7 * DAY + 1;
      const expired = await client.get('/dashboard');
      assert.equal(expired.status, 302);
      assert.equal(expired.headers.get('location'), '/login?reason=expired');
      assert.equal(client.cookies.has('sid'), false);
    } finally {
      await ctx.close();
    }
  });

  test('HTTPS 운영 설정에서는 __Host- 접두사와 Secure 속성이 붙은 쿠키를 쓴다', async () => {
    const ctx = await startTestServer({ env: { NODE_ENV: 'production' } });
    try {
      const res = await ctx.client().post('/api/auth/signup', VALID_SIGNUP);
      const cookie = res.setCookies.find((c) => c.startsWith('__Host-sid='));
      assert.ok(cookie);
      assert.match(cookie, /; Secure/);
      assert.match(cookie, /HttpOnly/);
    } finally {
      await ctx.close();
    }
  });
});
