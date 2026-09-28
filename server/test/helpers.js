import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';

export const VALID_SIGNUP = Object.freeze({
  name: '홍길동',
  email: 'hong@example.com',
  password: 'Passw0rd!',
  passwordConfirm: 'Passw0rd!',
});

/** 메모리 DB로 실제 HTTP 서버를 띄운다. */
export async function startTestServer({ env = {}, rateLimit, now } = {}) {
  const config = loadConfig({ NODE_ENV: 'test', ...env });
  if (rateLimit) Object.assign(config.rateLimit, rateLimit);
  const db = openDatabase(':memory:');
  const app = createApp({ db, config, now });
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return {
    baseUrl,
    db,
    config,
    client: () => new TestClient(baseUrl),
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          db.close();
          resolve();
        });
      }),
  };
}

/** 쿠키를 기억하는 간단한 HTTP 클라이언트(브라우저 흉내). 리디렉션은 따라가지 않는다. */
export class TestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  async request(path, { method = 'GET', json, body, headers = {} } = {}) {
    const requestHeaders = { ...headers };
    if (json !== undefined) {
      requestHeaders['content-type'] ??= 'application/json';
      body = JSON.stringify(json);
    }
    if (this.cookies.size > 0) {
      requestHeaders.cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    }

    const response = await fetch(this.baseUrl + path, { method, headers: requestHeaders, body, redirect: 'manual' });
    const setCookies = response.headers.getSetCookie();
    for (const header of setCookies) {
      const [pair, ...attributes] = header.split(';').map((part) => part.trim());
      const name = pair.slice(0, pair.indexOf('='));
      const value = pair.slice(pair.indexOf('=') + 1);
      const expires = attributes.find((attr) => /^expires=/i.test(attr));
      const cleared = !value || (expires && new Date(expires.slice(8)).getTime() < 1000);
      if (cleared) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      // HTML 또는 빈 응답
    }
    return { status: response.status, headers: response.headers, setCookies, text, data };
  }

  get(path, options) {
    return this.request(path, options);
  }

  post(path, json, options) {
    return this.request(path, { method: 'POST', json, ...options });
  }
}
