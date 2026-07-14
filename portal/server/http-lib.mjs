// 경량 HTTP 유틸 (의존성 없음)
export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
// 권한 없음은 단순 오류가 아니라 이유를 담아 안내
export const forbidden = (msg = '이 기능에 접근할 권한이 없습니다.') => new HttpError(403, msg, 'forbidden');
export const unauthorized = (msg = '로그인이 필요합니다.') => new HttpError(401, msg, 'unauthorized');
export const badRequest = (msg) => new HttpError(400, msg, 'bad_request');
export const notFound = (msg = '대상을 찾을 수 없습니다.') => new HttpError(404, msg, 'not_found');
export const conflict = (msg) => new HttpError(409, msg, 'conflict');

export function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function readBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, '요청 본문이 너무 큽니다.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(badRequest('요청 형식(JSON)이 올바르지 않습니다.')); }
    });
    req.on('error', reject);
  });
}

export function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

// 간단한 입력 검증 헬퍼
export function str(v, { required = false, max = 2000, name = '값' } = {}) {
  if (v == null || v === '') { if (required) throw badRequest(`${name}을(를) 입력해 주세요.`); return null; }
  const s = String(v);
  if (s.length > max) throw badRequest(`${name}이(가) 너무 깁니다.`);
  return s.trim();
}
export function oneOf(v, allowed, name = '값') {
  if (v == null) return null;
  if (!allowed.includes(v)) throw badRequest(`${name}이(가) 올바르지 않습니다.`);
  return v;
}
