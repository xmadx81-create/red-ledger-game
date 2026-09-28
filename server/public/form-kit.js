// 로그인·회원가입·대시보드 화면 공통 동작: 오류 표시, 비밀번호 표시/숨김, 처리 중 상태, API 요청

/** 입력란 아래 오류 문구를 표시하거나 지운다. 화면낭독기는 aria-describedby로 함께 읽는다. */
export function setFieldError(input, message) {
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) errorEl.textContent = message || '';
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

/** role="alert"/"status" 영역에 문구를 넣는다. 같은 문구가 반복돼도 다시 읽히도록 비운 뒤 채운다. */
export function announce(region, message) {
  region.textContent = '';
  if (message) setTimeout(() => (region.textContent = message), 50);
}

export function setupPasswordToggles(root = document) {
  for (const button of root.querySelectorAll('[data-password-toggle]')) {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    const label = button.dataset.label || '비밀번호';
    button.addEventListener('click', () => {
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.textContent = reveal ? '숨기기' : '표시';
      button.setAttribute('aria-label', `${label} ${reveal ? '숨기기' : '표시'}`);
    });
  }
}

/**
 * 버튼 처리 중 상태와 중복 요청 방지.
 * disabled 대신 aria-disabled를 써서 처리 중에도 키보드 포커스가 버튼에 남게 한다.
 */
export function createBusyState(button, { busyLabel, statusRegion }) {
  const labelEl = button.querySelector('.submit-label');
  const idleLabel = labelEl.textContent;
  let busy = false;
  button.disabled = false; // 스크립트 준비 완료 → 사용 가능

  const state = {
    get busy() {
      return busy;
    },
    start() {
      busy = true;
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('aria-busy', 'true');
      labelEl.textContent = busyLabel;
      if (statusRegion) announce(statusRegion, busyLabel);
    },
    stop() {
      busy = false;
      button.removeAttribute('aria-disabled');
      button.removeAttribute('aria-busy');
      labelEl.textContent = idleLabel;
      if (statusRegion) statusRegion.textContent = '';
    },
  };

  // 뒤로 가기 캐시로 화면이 복원되면 처리 중 상태를 풀어 준다.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && busy) state.stop();
  });
  return state;
}

/** JSON POST. 네트워크 오류·시간 초과는 status 0으로 돌려준다. */
export async function postJson(url, body, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal: controller.signal,
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

export function describeFailure(result) {
  if (result.status === 0) {
    return '서버에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  }
  return result.data?.error?.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

/**
 * 입력란별 검증 연결.
 * - 입력 중에는 오류를 새로 띄우지 않고, 한 번 입력을 마친(포커스를 벗어난) 뒤부터 즉시 다시 검사한다.
 * - validators: { 필드이름: () => 오류문구 | null }
 */
export function bindFieldValidation(fields, validators, { onInput } = {}) {
  const touched = new Set();
  const check = (key) => {
    const message = validators[key]();
    setFieldError(fields[key], message);
    return message;
  };

  for (const [key, input] of Object.entries(fields)) {
    input.addEventListener('blur', () => {
      if (input.value) touched.add(key);
      if (touched.has(key)) check(key);
    });
    input.addEventListener('input', () => {
      if (touched.has(key)) check(key);
      onInput?.(key, { touched, check });
    });
  }

  return {
    /** 모든 필드를 검사하고 오류가 있는 필드 이름 목록을 돌려준다. */
    checkAll() {
      Object.keys(fields).forEach((key) => touched.add(key));
      return Object.keys(fields).filter((key) => check(key));
    },
    /** 서버가 돌려준 필드별 오류를 표시하고, 첫 오류 필드 이름을 돌려준다. */
    applyServerErrors(fieldErrors = {}) {
      let first = null;
      for (const key of Object.keys(fields)) {
        if (fieldErrors[key]) {
          touched.add(key);
          setFieldError(fields[key], fieldErrors[key]);
          first ??= key;
        }
      }
      return first;
    },
  };
}
