import { normalizeEmail, validateEmail } from '/shared/validation.js';
import {
  announce,
  bindFieldValidation,
  createBusyState,
  describeFailure,
  postJson,
  setupPasswordToggles,
} from './form-kit.js';

const form = document.getElementById('login-form');
const alertRegion = document.getElementById('form-alert');
const noticeRegion = document.getElementById('form-notice');
const statusRegion = document.getElementById('form-status');
const fields = {
  email: form.elements.email,
  password: form.elements.password,
};

// 로그아웃·세션 만료 후 이동해 온 경우 안내 문구를 보여 주고 주소창을 정리한다.
const params = new URLSearchParams(window.location.search);
const notices = {
  loggedOut: { text: '로그아웃되었습니다.', tone: 'success' },
  expired: { text: '로그인 유지 시간이 지났습니다. 다시 로그인해 주세요.', tone: 'info' },
};
const notice = params.has('loggedOut') ? notices.loggedOut : params.get('reason') === 'expired' ? notices.expired : null;
if (notice) {
  noticeRegion.dataset.tone = notice.tone;
  announce(noticeRegion, notice.text);
  window.history.replaceState(null, '', '/login');
}

const validation = bindFieldValidation(fields, {
  email: () => validateEmail(normalizeEmail(fields.email.value)),
  password: () => (fields.password.value ? null : '비밀번호를 입력해 주세요.'),
});

setupPasswordToggles(form);
const busy = createBusyState(form.querySelector('[type="submit"]'), {
  busyLabel: '로그인 중…',
  statusRegion,
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy.busy) return; // 버튼 연타·엔터 반복으로 인한 중복 요청 방지

  announce(alertRegion, '');
  announce(noticeRegion, '');
  const invalid = validation.checkAll();
  if (invalid.length > 0) {
    fields[invalid[0]].focus();
    return;
  }

  busy.start();
  const result = await postJson('/api/auth/login', {
    email: fields.email.value,
    password: fields.password.value,
  });

  if (result.ok) {
    announce(statusRegion, '로그인되었습니다. 대시보드로 이동합니다.');
    window.location.replace('/dashboard');
    return; // 이동하는 동안 처리 중 상태 유지
  }

  busy.stop();
  const firstError = validation.applyServerErrors(result.data?.error?.fields);
  if (firstError) {
    fields[firstError].focus();
    return;
  }
  announce(alertRegion, describeFailure(result));
  if (result.data?.error?.code === 'INVALID_CREDENTIALS') {
    // 입력값은 그대로 두고, 다시 입력하기 쉽도록 비밀번호를 선택해 둔다.
    fields.password.focus();
    fields.password.select();
  }
});
