// 회원가입·로그인 입력 검증 규칙.
// 브라우저(/shared/validation.js 로 제공)와 서버가 같은 파일을 사용해 규칙이 어긋나지 않게 한다.

export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254;
export const EMAIL_LOCAL_MAX_LENGTH = 64;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// WHATWG HTML 이메일 규칙에 도메인 최상위 부분(.com 등)을 필수로 추가한 형태
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/;
const WHITESPACE = /\s/;
const LETTER = /[A-Za-z]/;
const DIGIT = /[0-9]/;
const SPECIAL = /[!-/:-@[-`{-~]/;

/** 이메일 정규화: 앞뒤 공백 제거 + 전체 소문자. 가입·로그인·중복 확인 모두 이 규칙을 따른다. */
export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

/** 이름 정규화: 유니코드 NFC 통일, 앞뒤 공백 제거, 연속 공백은 한 칸으로. */
export function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ');
}

export function validateName(name) {
  if (!name) return '이름을 입력해 주세요.';
  if ([...name].length > NAME_MAX_LENGTH) return `이름은 ${NAME_MAX_LENGTH}자 이하로 입력해 주세요.`;
  if (CONTROL_CHARS.test(name)) return '이름에 사용할 수 없는 문자가 포함되어 있습니다.';
  return null;
}

export function validateEmail(email) {
  if (!email) return '이메일을 입력해 주세요.';
  if (email.length > EMAIL_MAX_LENGTH || email.indexOf('@') > EMAIL_LOCAL_MAX_LENGTH) {
    return '이메일 주소가 너무 깁니다.';
  }
  if (!EMAIL_PATTERN.test(email)) return '올바른 이메일 형식이 아닙니다. 예: name@example.com';
  return null;
}

/** 비밀번호 정책 항목별 충족 여부. 화면의 체크리스트와 서버 검증이 함께 사용한다. */
export function passwordChecks(password) {
  const value = String(password ?? '');
  return [
    {
      id: 'length',
      label: `${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하`,
      ok: value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
    },
    { id: 'letter', label: '영문 포함', ok: LETTER.test(value) },
    { id: 'digit', label: '숫자 포함', ok: DIGIT.test(value) },
    { id: 'special', label: '특수문자 포함', ok: SPECIAL.test(value) },
    { id: 'space', label: '공백 없음', ok: value.length > 0 && !WHITESPACE.test(value) },
  ];
}

export function validatePassword(password) {
  const value = String(password ?? '');
  if (!value) return '비밀번호를 입력해 주세요.';
  const failed = new Set(passwordChecks(value).filter((c) => !c.ok).map((c) => c.id));
  if (failed.has('length')) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (failed.has('space')) return '비밀번호에 공백은 사용할 수 없습니다.';
  if (failed.size > 0) return '비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.';
  return null;
}

export function validatePasswordConfirm(password, passwordConfirm) {
  if (!passwordConfirm) return '비밀번호를 한 번 더 입력해 주세요.';
  if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
  return null;
}

function compact(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

/**
 * 회원가입 입력 검증.
 * @returns {{ values: { name: string, email: string, password: string }, errors: Record<string, string> }}
 */
export function validateSignup(input) {
  const name = normalizeName(input?.name);
  const email = normalizeEmail(input?.email);
  const password = typeof input?.password === 'string' ? input.password : '';
  const passwordConfirm = typeof input?.passwordConfirm === 'string' ? input.passwordConfirm : '';
  return {
    values: { name, email, password },
    errors: compact({
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirm(password, passwordConfirm),
    }),
  };
}

/**
 * 로그인 입력 검증. 비밀번호 정책은 가입 시점에만 적용한다(정책이 바뀌어도 기존 회원이 로그인할 수 있도록).
 */
export function validateLogin(input) {
  const email = normalizeEmail(input?.email);
  const password = typeof input?.password === 'string' ? input.password : '';
  return {
    values: { email, password },
    errors: compact({
      email: validateEmail(email),
      password: password ? null : '비밀번호를 입력해 주세요.',
    }),
  };
}
