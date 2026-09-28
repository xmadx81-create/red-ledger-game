import express from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { normalizeEmail, validateLogin, validateSignup } from '../../shared/validation.js';
import { hashPassword, needsRehash, verifyAgainstDummy, verifyPassword } from '../auth/password.js';
import { EmailTakenError, toPublicUser } from '../auth/users.js';
import { rejectCrossOriginWrites, requireAuth, requireJson, sendError } from '../http.js';

function createLimiter({ windowMs, limit, keyGenerator, skipSuccessfulRequests = false, message }) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, _next, options) => sendError(res, options.statusCode, 'RATE_LIMITED', message),
  });
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function sendEmailTaken(res) {
  return sendError(res, 409, 'EMAIL_TAKEN', '이미 가입된 이메일입니다.', {
    email: '이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 입력해 주세요.',
  });
}

/** /api/auth 아래의 회원가입·로그인·로그아웃·내 정보 API */
export function createAuthRouter({ config, users, sessions, cookies }) {
  const router = express.Router();
  const { windowMs } = config.rateLimit;
  const minutes = Math.ceil(windowMs / 60000);
  const ipKey = (req) => ipKeyGenerator(req.ip);

  const authPerIp = createLimiter({
    windowMs,
    limit: config.rateLimit.authRequestsPerIp,
    keyGenerator: ipKey,
    message: `요청이 너무 많습니다. ${minutes}분 후 다시 시도해 주세요.`,
  });
  const signupPerIp = createLimiter({
    windowMs,
    limit: config.rateLimit.signupsPerIp,
    keyGenerator: ipKey,
    message: `회원가입 요청이 너무 많습니다. ${minutes}분 후 다시 시도해 주세요.`,
  });
  // 비밀번호 대입 공격 차단: 같은 IP에서 같은 계정으로 실패가 누적되면 잠시 로그인을 막는다(성공 요청은 세지 않음).
  const loginPerAccount = createLimiter({
    windowMs,
    limit: config.rateLimit.loginFailuresPerAccount,
    keyGenerator: (req) => `${ipKey(req)}|${normalizeEmail(req.body?.email)}`,
    skipSuccessfulRequests: true,
    message: `로그인 시도가 너무 많습니다. ${minutes}분 후 다시 시도해 주세요.`,
  });

  // 로그인·가입 시 항상 새 세션을 발급하고, 기존 세션은 폐기한다(세션 고정 공격 방지).
  function startSession(req, res, userId) {
    if (req.auth) sessions.revoke(req.auth.token);
    const { token, expiresAt } = sessions.create(userId);
    cookies.set(res, token, expiresAt);
  }

  router.use(rejectCrossOriginWrites(config));
  router.use(express.json({ limit: '10kb' }));

  router.post('/signup', requireJson, authPerIp, signupPerIp, async (req, res) => {
    const { values, errors } = validateSignup(req.body);
    if (hasErrors(errors)) {
      return sendError(res, 400, 'VALIDATION_FAILED', '입력 내용을 확인해 주세요.', errors);
    }
    // 빠른 사전 확인. 동시에 들어온 요청은 아래 INSERT에서 DB UNIQUE 제약이 최종적으로 막는다.
    if (users.findByEmail(values.email)) return sendEmailTaken(res);

    const passwordHash = await hashPassword(values.password);
    let user;
    try {
      user = users.create({ name: values.name, email: values.email, passwordHash });
    } catch (error) {
      if (error instanceof EmailTakenError) return sendEmailTaken(res);
      throw error;
    }

    startSession(req, res, user.id);
    res.status(201).json({ user: toPublicUser(user) });
  });

  router.post('/login', requireJson, authPerIp, loginPerAccount, async (req, res) => {
    const { values, errors } = validateLogin(req.body);
    if (hasErrors(errors)) {
      return sendError(res, 400, 'VALIDATION_FAILED', '입력 내용을 확인해 주세요.', errors);
    }

    const user = users.findByEmail(values.email);
    const verified = user
      ? await verifyPassword(user.password_hash, values.password)
      : await verifyAgainstDummy(values.password);
    if (!user || !verified) {
      // 이메일이 없는지, 비밀번호가 틀렸는지 구분하지 않는다(가입 여부 노출 방지).
      return sendError(res, 401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (needsRehash(user.password_hash)) {
      users.updatePasswordHash(user.id, await hashPassword(values.password));
    }

    startSession(req, res, user.id);
    res.json({ user: toPublicUser(user) });
  });

  router.post('/logout', (req, res) => {
    if (req.auth) sessions.revoke(req.auth.token);
    cookies.clear(res);
    res.status(204).end();
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: toPublicUser(req.auth.user) });
  });

  return router;
}
