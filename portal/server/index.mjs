// EBTS 통합업무포털 — HTTP 서버 (의존성 없음, node:http + node:sqlite)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';
import { migrate } from './db.mjs';
import { login as doLogin, logout as doLogout, currentUser } from './auth.mjs';
import { logActivity } from './audit.mjs';
import { HttpError, unauthorized, forbidden, notFound, parseCookies, readBody, sendJson, str } from './http-lib.mjs';
import { authHandlers } from './handlers/auth.mjs';
import { adminHandlers } from './handlers/admin.mjs';
import { workLogHandlers } from './handlers/worklogs.mjs';
import { memberHandlers } from './handlers/members.mjs';
import { reportHandlers } from './handlers/reports.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const PORT = process.env.PORT || 4000;
const COOKIE = 'ebts_session';

migrate();

// 라우트 테이블: [method, path, permission|null, handler]
// permission==='@auth' → 로그인만 필요. null → 공개.
const routes = [
  ['GET',  '/api/setup/status', null, authHandlers.setupStatus],
  ['POST', '/api/setup/admin',  null, authHandlers.setupAdmin],
  ['POST', '/api/logout',       '@auth', authHandlers.logout],
  ['GET',  '/api/me',           '@auth', authHandlers.me],
  ['POST', '/api/me/password',  '@auth', authHandlers.changePassword],
  ['GET',  '/api/dashboard',    '@auth', reportHandlers.dashboard],

  ['GET',  '/api/users',        'user.read',   adminHandlers.listUsers],
  ['POST', '/api/users',        'user.manage', adminHandlers.createUser],
  ['PATCH','/api/users/:id',    'user.manage', adminHandlers.updateUser],
  ['POST', '/api/users/:id/suspend', 'user.manage', adminHandlers.suspendUser],
  ['DELETE','/api/users/:id',   'user.manage', adminHandlers.deleteUser],
  ['PUT',  '/api/users/:id/permissions', 'role.manage', adminHandlers.setUserPermissions],

  ['GET',  '/api/departments',  'dept.read',   adminHandlers.listDepartments],
  ['POST', '/api/departments',  'dept.manage', adminHandlers.createDepartment],
  ['PATCH','/api/departments/:id', 'dept.manage', adminHandlers.updateDepartment],
  ['GET',  '/api/positions',    '@auth',       adminHandlers.listPositions],

  ['GET',  '/api/roles',        'role.manage', adminHandlers.listRoles],
  ['POST', '/api/roles',        'role.manage', adminHandlers.createRole],
  ['PUT',  '/api/roles/:id/permissions', 'role.manage', adminHandlers.updateRolePermissions],

  ['GET',  '/api/work-logs',    'work_log.read',  workLogHandlers.list],
  ['POST', '/api/work-logs',    'work_log.write', workLogHandlers.create],
  ['GET',  '/api/work-logs/:id','work_log.read',  workLogHandlers.get],
  ['PATCH','/api/work-logs/:id','work_log.update',workLogHandlers.update],
  ['POST', '/api/work-logs/:id/approve', 'work_log.approve', workLogHandlers.approve],
  ['DELETE','/api/work-logs/:id','work_log.delete', workLogHandlers.remove],

  ['GET',  '/api/members',      'member.read',     memberHandlers.list],
  ['GET',  '/api/members/:id',  'member.read',     memberHandlers.get], // 상세는 내부에서 pii.read 재검증
  ['POST', '/api/members',      'member.pii.write',memberHandlers.create],
  ['PATCH','/api/members/:id',  'member.pii.write',memberHandlers.update],

  ['GET',  '/api/audit/activity', 'audit.read',     reportHandlers.activityLogs],
  ['GET',  '/api/audit/pii',      'audit.pii.read', reportHandlers.piiAccessLogs],
  ['GET',  '/api/usage',          'usage.read',     reportHandlers.usage],
];

function matchRoute(method, path) {
  for (const [m, pattern, perm, handler] of routes) {
    if (m !== method) continue;
    const pp = pattern.split('/'); const rp = path.split('/');
    if (pp.length !== rp.length) continue;
    const params = {}; let ok = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(rp[i]);
      else if (pp[i] !== rp[i]) { ok = false; break; }
    }
    if (ok) return { perm, handler, params };
  }
  return null;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

async function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  // 경로 추측/탈출 방지
  const safe = normalize(join(PUBLIC_DIR, rel));
  if (!safe.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('forbidden'); }
  if (!existsSync(safe)) {
    // SPA 폴백 아님 — 알려진 페이지만. 없으면 404.
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>404</h1><p>페이지를 찾을 수 없습니다.</p>');
  }
  const data = await readFile(safe);
  res.writeHead(200, {
    'Content-Type': MIME[extname(safe)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'",
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const meta = { ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0], user_agent: req.headers['user-agent'] || '' };

    if (!pathname.startsWith('/api/')) return serveStatic(req, res, pathname);

    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[COOKIE];
    const user = currentUser(token);

    // 로그인은 쿠키 설정이 필요해 별도 처리
    if (pathname === '/api/login' && req.method === 'POST') {
      const body = await readBody(req);
      const email = str(body.email, { required: true, name: '이메일' });
      const password = str(body.password, { required: true, name: '비밀번호' });
      const r = doLogin(email, password, meta);
      if (!r.ok) return sendJson(res, 401, { error: r.error });
      res.setHeader('Set-Cookie', `${COOKIE}=${r.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${8 * 3600}`);
      return sendJson(res, 200, { ok: true, user: r.user });
    }

    const route = matchRoute(req.method, pathname);
    if (!route) return sendJson(res, 404, { error: '요청하신 API를 찾을 수 없습니다.' });

    // 인증/권한 검사 (서버 강제)
    if (route.perm !== null) {
      if (!user) throw unauthorized();
      if (route.perm !== '@auth' && !user.has(route.perm)) {
        logActivity({ actor_id: user.id, actor_email: user.email, action: 'access.denied', detail: { path: pathname, need: route.perm }, ...meta });
        throw forbidden();
      }
    }

    const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req) : {};
    const query = Object.fromEntries(url.searchParams);
    const ctx = { user, token, body, query, params: route.params, meta };
    const result = await route.handler(ctx);

    // logout 시 쿠키 제거
    if (pathname === '/api/logout') res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
    sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message, code: err.code });
    console.error('[ERROR]', err);
    sendJson(res, 500, { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`EBTS 통합업무포털 → http://localhost:${PORT}`);
});
