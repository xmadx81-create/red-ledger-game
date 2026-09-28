import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { escapeHtml } from '../http.js';

function render(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(values[key] ?? ''));
}

/** 화면 라우트: /, /signup, /login, /dashboard */
export function createPageRouter({ viewsDir }) {
  const router = express.Router();
  const dashboardTemplate = fs.readFileSync(path.join(viewsDir, 'dashboard.html'), 'utf8');

  const sendView = (fileName) => (req, res) => res.sendFile(path.join(viewsDir, fileName));
  // 이미 로그인한 회원이 가입·로그인 화면에 오면 대시보드로 보낸다.
  const guestOnly = (req, res, next) => (req.auth ? res.redirect(302, '/dashboard') : next());

  router.get('/', (req, res) => res.redirect(302, req.auth ? '/dashboard' : '/login'));
  router.get('/signup', guestOnly, sendView('signup.html'));
  router.get('/login', guestOnly, sendView('login.html'));

  // 로그인 확인은 서버에서 한다. 로그인하지 않았으면 화면 자체를 내려주지 않는다.
  router.get('/dashboard', (req, res) => {
    if (!req.auth) {
      return res.redirect(302, req.sessionExpired ? '/login?reason=expired' : '/login');
    }
    const { name, email } = req.auth.user;
    res.type('html').send(render(dashboardTemplate, { name, email }));
  });

  return router;
}
