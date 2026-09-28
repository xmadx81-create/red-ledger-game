import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import { SERVER_ROOT } from './config.js';
import { createSessionStore } from './auth/sessions.js';
import { createUserRepository } from './auth/users.js';
import { createSessionCookies, loadSession, noStore, sendError } from './http.js';
import { createAuthRouter } from './routes/auth.js';
import { createPageRouter } from './routes/pages.js';

const VIEWS_DIR = path.join(SERVER_ROOT, 'views');

const ERROR_PAGE = (title, message) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | 헌혈의 집</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/auth.css"></head>
<body><main class="auth-page"><section class="auth-card"><h1 class="auth-title">${title}</h1>
<p class="auth-subtitle">${message}</p><p class="auth-switch"><a href="/">처음 화면으로 이동</a></p></section></main></body></html>`;

/**
 * Express 앱을 만든다. 테스트에서는 메모리 DB와 가짜 시계(now)를 넣어 사용한다.
 * @param {{ db: import('better-sqlite3').Database, config: ReturnType<import('./config.js').loadConfig>, now?: () => number }} deps
 */
export function createApp({ db, config, now = Date.now }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  const users = createUserRepository(db, { now });
  const sessions = createSessionStore(db, {
    ttlMs: config.sessionTtlMs,
    absoluteTtlMs: config.sessionAbsoluteTtlMs,
    now,
  });
  const cookies = createSessionCookies(config);
  app.locals.sessions = sessions;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'style-src': ["'self'"],
          'font-src': ["'self'"],
          'frame-ancestors': ["'none'"],
          // 개발 중 휴대폰에서 http://PC-IP:3000 으로 접속할 수 있도록 운영에서만 HTTPS 강제
          'upgrade-insecure-requests': config.isProduction ? [] : null,
        },
      },
      strictTransportSecurity: config.isProduction,
    }),
  );

  // 정적 파일(CSS/JS)은 세션 확인 없이 제공한다. 화면 HTML은 views/에 두어 라우트를 거쳐야만 열리게 한다.
  app.use('/assets', express.static(path.join(SERVER_ROOT, 'public'), { index: false }));
  app.use('/shared', express.static(path.join(SERVER_ROOT, 'shared'), { index: false }));

  app.use(loadSession({ sessions, cookies }));
  app.use('/api/auth', noStore, createAuthRouter({ config, users, sessions, cookies }));
  app.use(noStore, createPageRouter({ viewsDir: VIEWS_DIR }));

  // ── 향후 홈페이지 기능은 여기에 라우터를 추가한다.
  //    로그인 회원 전용 API 예) app.use('/api/posts', requireAuth, postsRouter)  (requireAuth: ./http.js)

  app.use('/api', (req, res) => sendError(res, 404, 'NOT_FOUND', '요청한 API를 찾을 수 없습니다.'));
  app.use((req, res) => {
    res.status(404).type('html').send(ERROR_PAGE('페이지를 찾을 수 없습니다', '주소를 다시 확인해 주세요.'));
  });

  app.use((error, req, res, next) => {
    const status = error.status ?? error.statusCode ?? 500;
    if (status >= 500) console.error('[auth-server] 처리 중 오류', error);
    if (res.headersSent) return next(error);
    if (req.originalUrl.startsWith('/api/')) {
      if (status === 413) return sendError(res, 413, 'PAYLOAD_TOO_LARGE', '요청 데이터가 너무 큽니다.');
      if (status < 500) return sendError(res, status, 'BAD_REQUEST', '요청 형식이 올바르지 않습니다.');
      return sendError(res, 500, 'SERVER_ERROR', '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
    res
      .status(status < 500 ? status : 500)
      .type('html')
      .send(ERROR_PAGE('문제가 발생했습니다', '잠시 후 다시 시도해 주세요.'));
  });

  return app;
}
