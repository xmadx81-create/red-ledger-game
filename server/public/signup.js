import {
  normalizeEmail,
  normalizeName,
  passwordChecks,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from '/shared/validation.js';
import {
  announce,
  bindFieldValidation,
  createBusyState,
  describeFailure,
  postJson,
  setupPasswordToggles,
} from './form-kit.js';

const form = document.getElementById('signup-form');
const alertRegion = document.getElementById('form-alert');
const statusRegion = document.getElementById('form-status');
const rulesList = document.getElementById('password-rules');
const fields = {
  name: form.elements.name,
  email: form.elements.email,
  password: form.elements.password,
  passwordConfirm: form.elements.passwordConfirm,
};

// ── 비밀번호 조건 체크리스트(규칙은 서버와 같은 shared/validation.js 기준) ──
const ruleItems = passwordChecks('').map((rule) => {
  const item = document.createElement('li');
  const text = document.createElement('span');
  const state = document.createElement('span');
  text.textContent = rule.label;
  state.className = 'sr-only';
  item.append(text, state);
  rulesList.append(item);
  return { item, state };
});

function renderRules() {
  passwordChecks(fields.password.value).forEach((rule, index) => {
    const { item, state } = ruleItems[index];
    item.classList.toggle('is-met', rule.ok);
    state.textContent = rule.ok ? ' (충족)' : ' (미충족)';
  });
}
renderRules();

const validation = bindFieldValidation(
  fields,
  {
    name: () => validateName(normalizeName(fields.name.value)),
    email: () => validateEmail(normalizeEmail(fields.email.value)),
    password: () => validatePassword(fields.password.value),
    passwordConfirm: () => validatePasswordConfirm(fields.password.value, fields.passwordConfirm.value),
  },
  {
    onInput(key, { touched, check }) {
      if (key !== 'password') return;
      renderRules();
      if (touched.has('passwordConfirm')) check('passwordConfirm');
    },
  },
);

setupPasswordToggles(form);
const busy = createBusyState(form.querySelector('[type="submit"]'), {
  busyLabel: '가입 처리 중…',
  statusRegion,
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy.busy) return; // 버튼 연타·엔터 반복으로 인한 중복 요청 방지

  announce(alertRegion, '');
  const invalid = validation.checkAll();
  if (invalid.length > 0) {
    fields[invalid[0]].focus();
    return;
  }

  busy.start();
  const result = await postJson('/api/auth/signup', {
    name: fields.name.value,
    email: fields.email.value,
    password: fields.password.value,
    passwordConfirm: fields.passwordConfirm.value,
  });

  if (result.ok) {
    announce(statusRegion, '회원가입이 완료되었습니다. 대시보드로 이동합니다.');
    window.location.replace('/dashboard');
    return; // 이동하는 동안 처리 중 상태 유지
  }

  busy.stop();
  const firstError = validation.applyServerErrors(result.data?.error?.fields);
  if (firstError) {
    fields[firstError].focus();
  } else {
    announce(alertRegion, describeFailure(result));
  }
});
