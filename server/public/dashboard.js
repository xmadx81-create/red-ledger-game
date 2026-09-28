import { announce, createBusyState, describeFailure, postJson } from './form-kit.js';

const logoutButton = document.getElementById('logout-button');
const alertRegion = document.getElementById('logout-alert');
const busy = createBusyState(logoutButton, {
  busyLabel: '로그아웃 중…',
  statusRegion: document.getElementById('logout-status'),
});

logoutButton.addEventListener('click', async () => {
  if (busy.busy) return;
  announce(alertRegion, '');
  busy.start();

  const result = await postJson('/api/auth/logout');
  if (result.ok) {
    window.location.replace('/login?loggedOut=1');
    return;
  }

  busy.stop();
  announce(alertRegion, `로그아웃하지 못했습니다. ${describeFailure(result)}`);
});

// 로그아웃 후 브라우저 뒤로 가기로 이 화면이 캐시에서 복원되면 로그인 상태를 다시 확인한다.
window.addEventListener('pageshow', async (event) => {
  if (!event.persisted) return;
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) window.location.replace('/login');
  } catch {
    // 오프라인이면 다음 요청에서 서버가 다시 확인한다.
  }
});
