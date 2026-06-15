const CODEX_LINK = './characters.html';

function createCodexButton() {
  const link = document.createElement('a');
  link.href = CODEX_LINK;
  link.className = 'secondary-button codex-inline-link';
  link.textContent = '캐릭터 도감';
  link.setAttribute('aria-label', '캐릭터 도감으로 이동');
  return link;
}

function ensureCodexButton() {
  const app = document.querySelector('#app');
  if (!app) return;

  const actionGroups = app.querySelectorAll('.actions');
  actionGroups.forEach((group) => {
    const hasCodex = group.querySelector('.codex-inline-link');
    if (hasCodex) return;

    const shouldShow =
      app.querySelector('.title-screen') ||
      app.querySelector('.day-header') ||
      app.querySelector('.final-screen');

    if (!shouldShow) return;
    group.appendChild(createCodexButton());
  });
}

function bootCodexLinker() {
  ensureCodexButton();
  const app = document.querySelector('#app');
  if (!app) return;

  const observer = new MutationObserver(() => ensureCodexButton());
  observer.observe(app, { childList: true, subtree: true });
}

bootCodexLinker();
