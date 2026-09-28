// 라우터들이 공통으로 쓰는 HTTP 보조 함수와 미들웨어.

/** API 오류 응답 형식: { error: { code, message, fields? } } */
export function sendError(res, status, code, message, fields) {
  return res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } });
}

export function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

export function requireJson(req, res, next) {
  if (!req.is('application/json')) {
    return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', '요청 형식이 올바르지 않습니다.');
  }
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF 방어: 상태를 바꾸는 요청은 같은 출처(우리 화면)에서 보낸 것만 받는다.
 * SameSite=Lax 쿠키와 함께 이중으로 막는다. Origin/Sec-Fetch-Site 헤더가 없는 요청(curl 등 비브라우저)은 쿠키 자동 첨부 위험이 없어 허용한다.
 */
export function rejectCrossOriginWrites(config) {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const fetchSite = req.get('sec-fetch-site');
    const origin = req.get('origin');
    const expectedOrigin = config.appOrigin ?? `${req.protocol}://${req.get('host')}`;
    const crossSite = fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none';
    if (crossSite || (origin && origin !== expectedOrigin)) {
      return sendError(
        res,
        403,
        'FORBIDDEN_ORIGIN',
        '허용되지 않은 요청입니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
      );
    }
    next();
  };
}

export function createSessionCookies(config) {
  const name = config.sessionCookieName;
  const options = { httpOnly: true, secure: config.secureCookies, sameSite: 'lax', path: '/' };

  return {
    read(req) {
      const header = req.headers.cookie;
      if (!header) return null;
      for (const part of header.split(';')) {
        const separator = part.indexOf('=');
        if (separator > 0 && part.slice(0, separator).trim() === name) {
          return part.slice(separator + 1).trim();
        }
      }
      return null;
    },
    set(res, token, expiresAt) {
      res.cookie(name, token, { ...options, expires: new Date(expiresAt) });
    },
    clear(res) {
      res.clearCookie(name, options);
    },
  };
}

/** 쿠키의 세션을 확인해 req.auth = { token, user } 를 채운다. 무효한 쿠키는 지운다. */
export function loadSession({ sessions, cookies }) {
  return (req, res, next) => {
    req.auth = null;
    req.sessionExpired = false;
    const token = cookies.read(req);
    if (token) {
      const session = sessions.validate(token);
      if (session) {
        req.auth = { token, user: session.user };
        if (session.renewed) cookies.set(res, token, session.expiresAt);
      } else {
        req.sessionExpired = true;
        cookies.clear(res);
      }
    }
    next();
  };
}

/** 로그인 회원만 쓸 수 있는 API에 붙인다. 로그인하지 않았으면 401. */
export function requireAuth(req, res, next) {
  if (!req.auth) return sendError(res, 401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
  next();
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
