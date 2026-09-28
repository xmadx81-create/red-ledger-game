import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';

const config = loadConfig();

if (config.isProduction && !config.secureCookies) {
  console.warn('[auth-server] 경고: 운영 모드인데 COOKIE_SECURE=false 입니다. HTTPS 배포라면 true로 두세요.');
}
if (config.isProduction && !config.appOrigin) {
  console.warn('[auth-server] 경고: APP_ORIGIN(배포 주소)이 설정되지 않았습니다. 프록시 뒤라면 반드시 설정하세요.');
}

const db = openDatabase(config.databasePath);
const app = createApp({ db, config });

// 만료된 세션 정리: 시작 시 1회 + 1시간마다
const { sessions } = app.locals;
sessions.purgeExpired();
setInterval(() => sessions.purgeExpired(), 60 * 60 * 1000).unref();

const server = app.listen(config.port, config.host, (error) => {
  if (error) {
    console.error(`[auth-server] ${config.port}번 포트에서 시작하지 못했습니다.`, error.message);
    process.exit(1);
  }
  console.log(`[auth-server] http://localhost:${config.port} 에서 실행 중 (DB: ${config.databasePath})`);
});

function shutdown(signal) {
  console.log(`[auth-server] ${signal} 수신 — 종료합니다.`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
