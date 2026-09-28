import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DAY_MS = 24 * 60 * 60 * 1000;

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

// TRUST_PROXY: 리버스 프록시(Nginx, 호스팅 로드밸런서 등) 뒤에서 실행할 때만 설정한다.
// 숫자(프록시 단계 수) 또는 Express trust proxy 문자열(loopback 등)을 받는다.
function parseTrustProxy(value) {
  if (value === undefined || value === '') return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export function loadConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const secureCookies = parseBoolean(env.COOKIE_SECURE, isProduction);
  return {
    isProduction,
    host: env.HOST || '0.0.0.0',
    port: Number(env.PORT) || 3000,
    databasePath: env.DATABASE_PATH || path.join(SERVER_ROOT, 'data', 'app.db'),
    // 배포 주소(예: https://example.com). 비우면 요청의 Host 기준으로 같은 출처인지 확인한다.
    appOrigin: env.APP_ORIGIN ? env.APP_ORIGIN.replace(/\/+$/, '') : null,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    secureCookies,
    // __Host- 접두사는 Secure + Path=/ + Domain 없음이 강제되는 쿠키라 HTTPS 배포에서만 사용한다.
    sessionCookieName: secureCookies ? '__Host-sid' : 'sid',
    // 로그인 유지: 7일 동안 접속이 없으면 만료, 접속할 때마다 연장하되 최초 로그인 후 30일이 상한
    sessionTtlMs: 7 * DAY_MS,
    sessionAbsoluteTtlMs: 30 * DAY_MS,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      loginFailuresPerAccount: 10, // 같은 IP + 같은 이메일의 로그인 실패 허용 횟수
      authRequestsPerIp: 100, // 같은 IP의 로그인·가입 요청 합계
      signupsPerIp: 10, // 같은 IP의 가입 요청
    },
  };
}
