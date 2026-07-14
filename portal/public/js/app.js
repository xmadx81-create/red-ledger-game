// EBTS 통합업무포털 — 프론트엔드 SPA (CSP 준수: 인라인 핸들러 없음, 이벤트 위임)
const app = document.getElementById('app');
let ME = null; // { user, permissions:Set }

// ── 유틸 ──────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const has = (p) => ME && ME.permissions.has(p);
function toast(msg, kind = '') {
  const box = document.getElementById('toast');
  const t = document.createElement('div'); t.className = 't ' + kind; t.textContent = msg;
  box.appendChild(t); setTimeout(() => t.remove(), 4000);
}
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch {}
  if (!res.ok) { const err = new Error((data && data.error) || '요청 처리 중 오류가 발생했습니다.'); err.status = res.status; err.data = data; throw err; }
  return data;
}

// ── 라우팅 ────────────────────────────
const ROUTES = {}; // name -> { title, perm, render }
function nav(name) { location.hash = '#/' + name; }
function currentRoute() { return (location.hash.replace(/^#\//, '') || 'dashboard').split('?')[0]; }

const NAV_ITEMS = [
  { name: 'dashboard', label: '대시보드', ico: '🏠', perm: null },
  { name: 'work-logs', label: '업무일지', ico: '📋', perm: 'work_log.read' },
  { name: 'members', label: '조합원·임직원', ico: '👥', perm: 'member.read' },
  { name: 'users', label: '사용자 관리', ico: '🧑‍💼', perm: 'user.read' },
  { name: 'departments', label: '부서 관리', ico: '🏢', perm: 'dept.read' },
  { name: 'roles', label: '역할·권한', ico: '🔑', perm: 'role.manage' },
  { name: 'audit', label: '감사 로그', ico: '📜', perm: 'audit.read' },
  { name: 'usage', label: '사용량', ico: '📊', perm: 'usage.read' },
  { name: 'my-info', label: '내 정보', ico: '⚙️', perm: null },
];

// ── 앱 부팅 ───────────────────────────
async function boot() {
  try {
    const me = await api('/api/me');
    ME = { user: me.user, permissions: new Set(me.permissions) };
    renderShell();
  } catch (e) {
    // 미로그인 → 로그인/초기설정 화면
    const s = await api('/api/setup/status').catch(() => ({ needsSetup: false }));
    if (s.needsSetup) renderSetup(); else renderLogin();
  }
}

window.addEventListener('hashchange', () => { if (ME) renderView(); });

// ── 로그인 / 초기설정 ─────────────────
function renderLogin() {
  app.innerHTML = `
  <div class="auth-wrap"><div class="auth-card">
    <h1>EBTS 통합업무포털</h1>
    <p class="muted">부서 업무·문서·인적사항을 한 곳에서 관리합니다.</p>
    <form data-form="login">
      <label>이메일 <span class="req">*</span></label>
      <input name="email" type="email" autocomplete="username" required placeholder="admin@ebts.local" />
      <label>비밀번호 <span class="req">*</span></label>
      <input name="password" type="password" autocomplete="current-password" required />
      <div class="actions" style="justify-content:stretch">
        <button class="btn primary" style="width:100%" type="submit">🔓 로그인</button>
      </div>
    </form>
    <p class="muted" style="font-size:.82rem;margin-top:1rem">테스트 계정: admin@ebts.local · 비밀번호 Test1234! (개발용)</p>
  </div></div>`;
}

function renderSetup() {
  app.innerHTML = `
  <div class="auth-wrap"><div class="auth-card">
    <h1>초기 관리자 설정</h1>
    <p class="muted">최초 1회, 최고관리자 계정을 생성합니다.</p>
    <form data-form="setup">
      <label>이름 <span class="req">*</span></label><input name="full_name" required />
      <label>이메일 <span class="req">*</span></label><input name="email" type="email" required />
      <label>비밀번호 (8자 이상) <span class="req">*</span></label><input name="password" type="password" minlength="8" required />
      <div class="actions" style="justify-content:stretch">
        <button class="btn primary" style="width:100%" type="submit">관리자 계정 생성</button>
      </div>
    </form>
  </div></div>`;
}

// ── 공통 셸(사이드바 + 본문) ───────────
function renderShell() {
  const items = NAV_ITEMS.filter((i) => i.perm === null || has(i.perm));
  const navHtml = items.map((i) => `<a href="#/${i.name}" data-nav="${i.name}"><span class="ico">${i.ico}</span> ${i.label}</a>`).join('');
  const mobileHtml = items.slice(0, 5).map((i) => `<a href="#/${i.name}" data-nav="${i.name}"><span class="ico">${i.ico}</span>${i.label}</a>`).join('');
  const roleName = { super_admin: '최고관리자', privacy_officer: '개인정보관리자', dept_head: '부서장', dept_member: '부서원', member: '조합원', auditor: '감사·열람' }[ME.user.role_id] || ME.user.role_id;
  app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">🗂 EBTS 포털</div>
      <nav class="nav">${navHtml}</nav>
    </aside>
    <main class="main">
      <div class="topbar">
        <div><div class="crumb" id="crumb"></div></div>
        <div class="userbox">
          <span class="badge">${esc(roleName)}</span>
          <span>${esc(ME.user.full_name)}</span>
          <button class="btn sm ghost" data-action="logout">로그아웃</button>
        </div>
      </div>
      <div id="view"></div>
    </main>
    <nav class="mobile-nav">${mobileHtml}</nav>
  </div>`;
  renderView();
}

function setActiveNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
}

async function renderView() {
  const name = currentRoute();
  const item = NAV_ITEMS.find((i) => i.name === name);
  setActiveNav(name);
  document.getElementById('crumb').textContent = 'EBTS 포털 › ' + (item ? item.label : name);
  const view = document.getElementById('view');
  if (item && item.perm && !has(item.perm)) {
    view.innerHTML = accessDenied(item.label);
    return;
  }
  view.innerHTML = '<div class="empty">불러오는 중…</div>';
  const fn = VIEWS[name] || VIEWS.dashboard;
  try { await fn(view); } catch (e) { view.innerHTML = `<div class="card"><p class="pii">오류: ${esc(e.message)}</p></div>`; }
}

function accessDenied(label) {
  return `<div class="empty"><div class="big">🔒</div><h2>접근 제한</h2>
    <p class="muted">'${esc(label)}' 기능에 접근할 권한이 없습니다.<br>필요 시 관리자에게 권한을 요청하세요.</p></div>`;
}

// ── 화면(뷰)들 ────────────────────────
const VIEWS = {};

VIEWS.dashboard = async (view) => {
  const d = await api('/api/dashboard');
  const c = d.cards;
  const stats = [];
  if (c.my_open !== undefined) stats.push(['내 미완료 업무', c.my_open]);
  if (c.pending_review !== undefined) stats.push(['승인 대기 업무', c.pending_review]);
  if (c.user_count !== undefined) stats.push(['전체 사용자', c.user_count]);
  if (c.member_count !== undefined) stats.push(['등록 인적사항', c.member_count]);
  const statCards = stats.map(([l, n]) => `<div class="card stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('') || '<div class="card"><p class="muted">표시할 요약 정보가 없습니다.</p></div>';
  const recent = (c.my_recent || []).map((w) => `<tr><td>${esc(w.title)}</td>${statusTag(w.status)}<td class="muted">${esc(w.work_date || '')}</td></tr>`).join('');
  const activity = (c.recent_activity || []).map((a) => `<tr><td>${esc(a.action)}</td><td class="muted">${esc(a.actor_email || '')}</td><td class="muted">${esc(a.created_at)}</td></tr>`).join('');
  view.innerHTML = `
    <h1>${esc(d.greeting)}님, 안녕하세요.</h1>
    <div class="grid">${statCards}</div>
    ${c.my_recent ? `<div class="card"><h2>최근 내 업무</h2><div class="table-wrap"><table><thead><tr><th>제목</th><th>상태</th><th>업무일</th></tr></thead><tbody>${recent || '<tr><td colspan="3" class="muted">최근 업무가 없습니다.</td></tr>'}</tbody></table></div></div>` : ''}
    ${c.recent_activity ? `<div class="card"><h2>최근 시스템 활동</h2><div class="table-wrap"><table><thead><tr><th>동작</th><th>사용자</th><th>시간</th></tr></thead><tbody>${activity}</tbody></table></div></div>` : ''}`;
};

// 업무일지
const STATUS_LABEL = { planned: '예정', in_progress: '진행 중', review: '검토 요청', hold: '보류', done: '완료', canceled: '취소' };
const PRIORITY_LABEL = { low: '낮음', normal: '보통', high: '높음', urgent: '긴급' };
const VIS_LABEL = { all: '전체 공개', members: '전 조합원', staff: '임직원', department: '부서 공개', author_admin: '작성자·관리자' };
function statusTag(s) { return `<td><span class="tag s-${s}">${STATUS_LABEL[s] || s}</span></td>`; }

VIEWS['work-logs'] = async (view) => {
  const params = new URLSearchParams();
  const q = getQuery();
  if (q.status) params.set('status', q.status);
  if (q.q) params.set('q', q.q);
  const { work_logs } = await api('/api/work-logs?' + params.toString());
  const rows = work_logs.map((w) => `
    <tr>
      <td><a href="#" data-action="wl-detail" data-id="${w.id}"><b>${esc(w.title)}</b></a><div class="muted" style="font-size:.8rem">${esc(w.dept_name || '')} · ${VIS_LABEL[w.visibility] || w.visibility}</div></td>
      ${statusTag(w.status)}
      <td>${w.priority === 'urgent' || w.priority === 'high' ? `<span class="tag p-${w.priority}">${PRIORITY_LABEL[w.priority]}</span>` : PRIORITY_LABEL[w.priority] || ''}</td>
      <td>${esc(w.assignee_name || '-')}</td>
      <td class="muted">${esc(w.work_date || '')}</td>
    </tr>`).join('');
  view.innerHTML = `
    <div class="topbar" style="border:none;padding:0">
      <h1>업무일지</h1>
      ${has('work_log.write') ? '<button class="btn primary" data-action="wl-new">＋ 새 업무일지</button>' : ''}
    </div>
    <div class="filters card">
      <div><label>상태</label><select data-filter="status">
        <option value="">전체</option>${Object.entries(STATUS_LABEL).map(([k, v]) => `<option value="${k}" ${q.status === k ? 'selected' : ''}>${v}</option>`).join('')}
      </select></div>
      <div><label>검색어</label><input data-filter="q" value="${esc(q.q || '')}" placeholder="제목·내용" /></div>
      <div style="align-self:end"><button class="btn" data-action="wl-search">🔍 검색</button></div>
    </div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>제목</th><th>상태</th><th>우선순위</th><th>담당자</th><th>업무일</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" class="empty">조회 가능한 업무일지가 없습니다. 권한과 공개 범위에 따라 표시됩니다.</td></tr>'}</tbody>
    </table></div></div>`;
};

async function openWorkLog(id) {
  const { work_log: w } = await api('/api/work-logs/' + id);
  const canEdit = has('work_log.update');
  modal(`업무일지 상세`, `
    <div class="row"><div><b>제목</b><p>${esc(w.title)}</p></div><div><b>상태</b><p>${STATUS_LABEL[w.status]}</p></div></div>
    <b>내용</b><p style="white-space:pre-wrap">${esc(w.content || '-')}</p>
    <div class="row">
      <div><b>우선순위</b><p>${PRIORITY_LABEL[w.priority]}</p></div>
      <div><b>공개 범위</b><p>${VIS_LABEL[w.visibility]}</p></div>
      <div><b>버전</b><p>v${w.version}</p></div>
    </div>
    <div class="row"><div><b>문제점</b><p>${esc(w.issues || '-')}</p></div><div><b>조치사항</b><p>${esc(w.actions || '-')}</p></div></div>
    <p class="muted" style="font-size:.82rem">작성일시 ${esc(w.created_at)} · 수정일시 ${esc(w.updated_at || '-')}</p>
    <div class="actions">
      ${canEdit ? `<button class="btn" data-action="wl-edit" data-id="${w.id}">✏️ 수정</button>` : ''}
      ${has('work_log.approve') ? `<button class="btn primary" data-action="wl-approve" data-id="${w.id}">✅ 승인(완료)</button>` : ''}
      <button class="btn ghost" data-action="close-modal">닫기</button>
    </div>`);
}

function workLogForm(w) {
  const v = w || {};
  return `
  <form data-form="worklog" data-id="${v.id || ''}" data-version="${v.version || ''}">
    <label>업무 제목 <span class="req">*</span></label><input name="title" required value="${esc(v.title || '')}" />
    <label>내용</label><textarea name="content">${esc(v.content || '')}</textarea>
    <div class="row">
      <div><label>진행 상태</label><select name="status">${Object.entries(STATUS_LABEL).map(([k, l]) => `<option value="${k}" ${v.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div><label>우선순위</label><select name="priority">${Object.entries(PRIORITY_LABEL).map(([k, l]) => `<option value="${k}" ${v.priority === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="row">
      <div><label>목표 완료일</label><input name="due_date" type="date" value="${esc(v.due_date || '')}" /></div>
      <div><label>공개 범위</label><select name="visibility">${Object.entries(VIS_LABEL).map(([k, l]) => `<option value="${k}" ${v.visibility === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div>
    <label>문제점</label><textarea name="issues">${esc(v.issues || '')}</textarea>
    <label>조치사항 / 다음 계획</label><textarea name="actions">${esc(v.actions || '')}</textarea>
    <div class="actions">
      <button class="btn ghost" type="button" data-action="close-modal">취소</button>
      <button class="btn primary" type="submit">💾 저장</button>
    </div>
  </form>`;
}

// 조합원 인적사항
VIEWS.members = async (view) => {
  const q = getQuery();
  const params = new URLSearchParams(); if (q.q) params.set('q', q.q);
  const { members, can_view_pii } = await api('/api/members?' + params.toString());
  const rows = members.map((m) => `
    <tr>
      <td>${esc(m.mgmt_no)}</td>
      <td><b>${esc(m.name)}</b></td>
      <td>${esc(m.member_type || '')}</td>
      <td>${esc(m.affiliation || '')}</td>
      <td class="muted">${esc(m.phone || '')}</td>
      <td>${can_view_pii ? `<button class="btn sm" data-action="member-detail" data-id="${m.id}">🔎 상세 열람</button>` : '<span class="muted">마스킹</span>'}</td>
    </tr>`).join('');
  view.innerHTML = `
    <div class="topbar" style="border:none;padding:0"><h1>조합원·임직원 인적사항</h1>
      ${has('member.pii.write') ? '<button class="btn primary" data-action="member-new">＋ 신규 등록</button>' : ''}</div>
    <div class="notice">🔐 목록의 개인정보(이름·연락처·생년월일)는 마스킹되어 표시됩니다. ${can_view_pii ? '상세 열람 시 <b>열람 목적</b>을 입력해야 하며, 열람 이력이 기록됩니다.' : '상세 원문 열람 권한이 없습니다.'}</div>
    <div class="filters card"><div><label>검색</label><input data-filter="q" value="${esc(q.q || '')}" placeholder="이름·관리번호·소속" /></div>
      <div style="align-self:end"><button class="btn" data-action="member-search">🔍 검색</button></div></div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>관리번호</th><th>이름</th><th>구분</th><th>소속</th><th>연락처</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="empty">등록된 인적사항이 없습니다.</td></tr>'}</tbody></table></div></div>`;
};

async function openMember(id) {
  const purpose = prompt('개인정보 열람 목적(사유)을 입력하세요.\n(예: 민원 확인, 연락처 확인 등 — 열람 이력이 기록됩니다.)');
  if (!purpose) { toast('열람 목적을 입력해야 상세를 볼 수 있습니다.'); return; }
  try {
    const { member: m } = await api(`/api/members/${id}?purpose=${encodeURIComponent(purpose)}`);
    modal('인적사항 상세 (원문)', `
      <div class="notice">이 열람 기록이 개인정보 열람이력에 저장되었습니다. 목적: ${esc(purpose)}</div>
      <div class="row"><div><b>관리번호</b><p>${esc(m.mgmt_no)}</p></div><div><b>이름</b><p>${esc(m.name)}</p></div><div><b>구분</b><p>${esc(m.member_type || '')}</p></div></div>
      <div class="row"><div><b>연락처</b><p class="pii">${esc(m.phone || '-')}</p></div><div><b>이메일</b><p>${esc(m.email || '-')}</p></div><div><b>생년월일</b><p class="pii">${esc(m.birth_date || '-')}</p></div></div>
      <div class="row"><div><b>소속</b><p>${esc(m.affiliation || '-')}</p></div><div><b>지역본부</b><p>${esc(m.region_hq || '-')}</p></div></div>
      <b>주소</b><p class="pii">${esc(m.address || '-')}</p>
      <b>비고</b><p>${esc(m.note || '-')}</p>
      <div class="actions">
        ${has('member.pii.write') ? `<button class="btn" data-action="member-edit" data-id="${m.id}">✏️ 수정</button>` : ''}
        <button class="btn ghost" data-action="close-modal">닫기</button>
      </div>`);
  } catch (e) { toast(e.message, 'err'); }
}

function memberForm(m) {
  const v = m || {};
  const f = (n, label, type = 'text') => `<div><label>${label}</label><input name="${n}" type="${type}" value="${esc(v[n] || '')}" /></div>`;
  return `<form data-form="member" data-id="${v.id || ''}">
    <div class="row"><div><label>이름 <span class="req">*</span></label><input name="name" required value="${esc(v.name || '')}" /></div>${f('member_type', '구분(조합원/임직원)')}</div>
    <div class="row">${f('affiliation', '소속')}${f('region_hq', '지역본부')}${f('branch', '지부')}</div>
    <div class="row">${f('phone', '연락처', 'tel')}${f('email', '이메일', 'email')}${f('birth_date', '생년월일', 'date')}</div>
    <div class="row">${f('join_date', '가입일', 'date')}${f('duty', '담당 업무')}</div>
    <label>주소</label><input name="address" value="${esc(v.address || '')}" />
    <label>비고</label><textarea name="note">${esc(v.note || '')}</textarea>
    <div class="notice">⚠️ 주민등록번호·계좌번호 등 고위험 정보는 입력하지 마세요(MVP 미수집).</div>
    <div class="actions"><button class="btn ghost" type="button" data-action="close-modal">취소</button><button class="btn primary" type="submit">💾 저장</button></div>
  </form>`;
}

// 사용자 관리
VIEWS.users = async (view) => {
  const [{ users }, roles, depts] = await Promise.all([
    api('/api/users'),
    api('/api/roles').catch(() => ({ roles: [] })),
    api('/api/departments').catch(() => ({ departments: [] })),
  ]);
  window.__roles = roles.roles || []; window.__depts = depts.departments || [];
  const statusLabel = { active: '활성', suspended: '정지', pending: '대기', resigned: '퇴사' };
  const rows = users.map((u) => `
    <tr>
      <td><b>${esc(u.full_name)}</b><div class="muted" style="font-size:.8rem">${esc(u.email)}</div></td>
      <td>${esc(u.role_name || u.role_id)}</td>
      <td>${esc(u.dept_name || '-')}</td>
      <td><span class="tag ${u.status === 'active' ? 's-done' : u.status === 'suspended' ? 's-canceled' : 's-review'}">${statusLabel[u.status] || u.status}</span></td>
      <td class="muted">${esc(u.last_login_at || '없음')}</td>
      <td>
        <button class="btn sm" data-action="user-edit" data-id="${u.id}">수정</button>
        ${u.status !== 'suspended' ? `<button class="btn sm ghost" data-action="user-suspend" data-id="${u.id}">정지</button>` : ''}
      </td>
    </tr>`).join('');
  view.innerHTML = `
    <div class="topbar" style="border:none;padding:0"><h1>사용자 관리</h1>
      ${has('user.manage') ? '<button class="btn primary" data-action="user-new">＋ 사용자 추가</button>' : ''}</div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>이름</th><th>역할</th><th>부서</th><th>상태</th><th>마지막 로그인</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
};

function userForm(u) {
  const v = u || {};
  const roleOpts = (window.__roles || []).map((r) => `<option value="${r.id}" ${v.role_id === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
  const deptOpts = '<option value="">(없음)</option>' + (window.__depts || []).map((d) => `<option value="${d.id}" ${v.department_id === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
  return `<form data-form="user" data-id="${v.id || ''}">
    <div class="row"><div><label>이름 <span class="req">*</span></label><input name="full_name" required value="${esc(v.full_name || '')}" /></div>
      <div><label>이메일 <span class="req">*</span></label><input name="email" type="email" ${v.id ? 'disabled' : 'required'} value="${esc(v.email || '')}" /></div></div>
    <div class="row"><div><label>역할 <span class="req">*</span></label><select name="role_id" required>${roleOpts}</select></div>
      <div><label>부서</label><select name="department_id">${deptOpts}</select></div></div>
    <label>${v.id ? '비밀번호 재설정(변경 시에만 입력)' : '초기 비밀번호(8자 이상) *'}</label>
    <input name="password" type="password" ${v.id ? '' : 'required minlength="8"'} placeholder="${v.id ? '비워두면 변경 안 함' : ''}" />
    ${v.id ? `<label>상태</label><select name="status">${['active', 'suspended', 'pending', 'resigned'].map((s) => `<option value="${s}" ${v.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : ''}
    <div class="actions"><button class="btn ghost" type="button" data-action="close-modal">취소</button><button class="btn primary" type="submit">💾 저장</button></div>
  </form>`;
}

// 부서 관리
VIEWS.departments = async (view) => {
  const { departments } = await api('/api/departments');
  const rows = departments.map((d) => `
    <tr><td><b>${esc(d.name)}</b></td><td>${esc(d.head_name || '-')}</td><td>${d.member_count}명</td>
    <td>${has('dept.manage') ? `<button class="btn sm" data-action="dept-edit" data-id="${d.id}">수정</button>` : ''}</td></tr>`).join('');
  view.innerHTML = `<div class="topbar" style="border:none;padding:0"><h1>부서 관리</h1>
    ${has('dept.manage') ? '<button class="btn primary" data-action="dept-new">＋ 부서 추가</button>' : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>부서명</th><th>부서장</th><th>인원</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
};

// 역할·권한
VIEWS.roles = async (view) => {
  const { roles, all_permissions } = await api('/api/roles');
  const byCat = {};
  all_permissions.forEach((p) => (byCat[p.category] ||= []).push(p));
  const cards = roles.map((r) => {
    const set = new Set(r.permissions);
    const groups = Object.entries(byCat).map(([cat, perms]) => `
      <div><b style="font-size:.85rem">${cat}</b>${perms.map((p) => `<label><input type="checkbox" data-perm="${p.id}" ${set.has(p.id) ? 'checked' : ''} ${r.is_system && r.id === 'super_admin' ? 'disabled' : ''}/> ${esc(p.name)}</label>`).join('')}</div>`).join('');
    return `<div class="card" data-role="${r.id}">
      <div class="topbar" style="border:none;padding:0"><h2 style="margin:0">${esc(r.name)} ${r.is_system ? '<span class="badge">시스템</span>' : ''}</h2>
        <button class="btn sm primary" data-action="role-save" data-id="${r.id}">권한 저장</button></div>
      <p class="muted" style="font-size:.85rem">${esc(r.description || '')}</p>
      <div class="perm-grid">${groups}</div></div>`;
  }).join('');
  view.innerHTML = `<div class="topbar" style="border:none;padding:0"><h1>역할·권한 관리</h1><button class="btn" data-action="role-new">＋ 역할 추가</button></div>
    <div class="notice">권한 변경은 즉시 서버 정책에 반영되며, 모든 API에서 강제됩니다. (최고관리자 권한은 잠금)</div>${cards}`;
};

// 감사 로그
VIEWS.audit = async (view) => {
  const tab = getQuery().tab || 'activity';
  const canPii = has('audit.pii.read');
  let body = '';
  if (tab === 'pii' && canPii) {
    const { logs } = await api('/api/audit/pii');
    body = `<div class="table-wrap"><table><thead><tr><th>시간</th><th>조회자</th><th>대상</th><th>동작</th><th>목적</th></tr></thead>
      <tbody>${logs.map((l) => `<tr><td class="muted">${esc(l.created_at)}</td><td>${esc(l.actor_email || '')}</td><td>${esc(l.member_name || l.member_id)}</td><td>${esc(l.action)}</td><td>${esc(l.purpose || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">기록 없음</td></tr>'}</tbody></table></div>`;
  } else {
    const { logs } = await api('/api/audit/activity');
    body = `<div class="table-wrap"><table><thead><tr><th>시간</th><th>사용자</th><th>동작</th><th>대상</th><th>상세</th></tr></thead>
      <tbody>${logs.map((l) => `<tr><td class="muted">${esc(l.created_at)}</td><td>${esc(l.actor_email || '시스템')}</td><td><span class="tag">${esc(l.action)}</span></td><td class="muted">${esc(l.entity_type || '')} ${esc(l.entity_id || '')}</td><td class="muted" style="font-size:.8rem">${esc(l.detail || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">기록 없음</td></tr>'}</tbody></table></div>`;
  }
  view.innerHTML = `<h1>감사 로그</h1>
    <div class="filters">
      <a class="btn ${tab === 'activity' ? 'primary' : ''}" href="#/audit?tab=activity">활동 로그</a>
      ${canPii ? `<a class="btn ${tab === 'pii' ? 'primary' : ''}" href="#/audit?tab=pii">개인정보 열람이력</a>` : ''}
    </div>
    <div class="notice">감사 로그는 읽기 전용입니다. 수정·삭제 API가 제공되지 않습니다.</div>
    <div class="card">${body}</div>`;
};

// 사용량
VIEWS.usage = async (view) => {
  const u = await api('/api/usage');
  const stat = (n, l) => `<div class="card stat"><div class="n">${n}</div><div class="l">${l}</div></div>`;
  view.innerHTML = `<h1>데이터·저장공간 사용량</h1>
    <div class="grid">
      ${stat(u.users, '전체 사용자')}${stat(u.active_users, '활성 사용자')}${stat(u.monthly_active_users, '월간 활성(30일)')}
      ${stat(u.work_logs, '업무일지')}${stat(u.members, '인적사항')}${stat(u.departments, '부서')}
      ${stat(u.db_mb + ' MB', 'DB 사용량')}${stat(u.db_usage_pct + '%', '무료한도(500MB) 사용률')}
      ${stat(u.activity_logs, '감사 로그')}${stat(u.pii_access_logs, '개인정보 열람이력')}
    </div>
    <div class="notice">${esc(u.note)}</div>`;
};

// 내 정보
VIEWS['my-info'] = async (view) => {
  view.innerHTML = `<h1>내 정보</h1>
    <div class="card"><h2>계정</h2>
      <p><b>이름</b> ${esc(ME.user.full_name)}</p><p><b>이메일</b> ${esc(ME.user.email)}</p>
      <p><b>역할</b> ${esc(ME.user.role_id)}</p>
      <p><b>보유 권한</b> <span class="muted">${[...ME.permissions].join(', ')}</span></p></div>
    <div class="card"><h2>비밀번호 변경</h2>
      <form data-form="password">
        <label>현재 비밀번호</label><input name="current" type="password" required />
        <label>새 비밀번호(8자 이상)</label><input name="next" type="password" minlength="8" required />
        <div class="actions"><button class="btn primary" type="submit">비밀번호 변경</button></div>
      </form></div>`;
};

// ── 헬퍼: 쿼리, 모달, 폼값 ────────────
function getQuery() { const h = location.hash.split('?')[1] || ''; return Object.fromEntries(new URLSearchParams(h)); }
function modal(title, inner) {
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.dataset.modal = '1';
  bg.innerHTML = `<div class="modal"><h2>${esc(title)}</h2>${inner}</div>`;
  document.body.appendChild(bg);
}
function closeModal() { document.querySelectorAll('[data-modal]').forEach((m) => m.remove()); }
function formData(form) { const o = {}; new FormData(form).forEach((v, k) => (o[k] = v)); return o; }

// ── 이벤트 위임 ───────────────────────
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-form]'); if (!form) return;
  e.preventDefault();
  const type = form.dataset.form; const d = formData(form);
  try {
    if (type === 'login') { await api('/api/login', { method: 'POST', body: d }); await boot(); return; }
    if (type === 'setup') { await api('/api/setup/admin', { method: 'POST', body: d }); toast('관리자 계정이 생성되었습니다. 로그인하세요.', 'ok'); renderLogin(); return; }
    if (type === 'password') { await api('/api/me/password', { method: 'POST', body: d }); toast('비밀번호가 변경되었습니다.', 'ok'); form.reset(); return; }
    if (type === 'worklog') {
      const id = form.dataset.id;
      if (id) { await api('/api/work-logs/' + id, { method: 'PATCH', body: { ...d, version: Number(form.dataset.version) } }); toast('저장되었습니다.', 'ok'); }
      else { await api('/api/work-logs', { method: 'POST', body: d }); toast('업무일지가 등록되었습니다.', 'ok'); }
      closeModal(); renderView(); return;
    }
    if (type === 'member') {
      const id = form.dataset.id;
      if (id) await api('/api/members/' + id, { method: 'PATCH', body: { ...d, purpose: '정보 수정' } });
      else await api('/api/members', { method: 'POST', body: d });
      toast('저장되었습니다.', 'ok'); closeModal(); renderView(); return;
    }
    if (type === 'user') {
      const id = form.dataset.id;
      if (id) { const b = { ...d }; if (!b.password) delete b.password; await api('/api/users/' + id, { method: 'PATCH', body: b }); }
      else await api('/api/users', { method: 'POST', body: d });
      toast('저장되었습니다.', 'ok'); closeModal(); renderView(); return;
    }
    if (type === 'dept') {
      const id = form.dataset.id;
      if (id) await api('/api/departments/' + id, { method: 'PATCH', body: d });
      else await api('/api/departments', { method: 'POST', body: d });
      toast('저장되었습니다.', 'ok'); closeModal(); renderView(); return;
    }
    if (type === 'role') { await api('/api/roles', { method: 'POST', body: d }); toast('역할이 추가되었습니다.', 'ok'); closeModal(); renderView(); return; }
  } catch (err) { toast(err.message, 'err'); }
});

document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action]'); if (!t) return;
  const a = t.dataset.action; const id = t.dataset.id;
  const stop = () => e.preventDefault();
  try {
    if (a === 'logout') { stop(); await api('/api/logout', { method: 'POST' }); ME = null; location.hash = ''; renderLogin(); return; }
    if (a === 'close-modal') { stop(); closeModal(); return; }
    if (a === 'wl-new') { stop(); modal('새 업무일지', workLogForm(null)); return; }
    if (a === 'wl-detail') { stop(); openWorkLog(id); return; }
    if (a === 'wl-edit') { stop(); const { work_log } = await api('/api/work-logs/' + id); closeModal(); modal('업무일지 수정', workLogForm(work_log)); return; }
    if (a === 'wl-approve') { stop(); await api('/api/work-logs/' + id + '/approve', { method: 'POST' }); toast('승인되었습니다.', 'ok'); closeModal(); renderView(); return; }
    if (a === 'wl-search' || a === 'member-search') { stop(); const q = {}; document.querySelectorAll('[data-filter]').forEach((f) => { if (f.value) q[f.dataset.filter] = f.value; }); const base = currentRoute(); location.hash = `#/${base}?${new URLSearchParams(q)}`; return; }
    if (a === 'member-new') { stop(); modal('인적사항 신규 등록', memberForm(null)); return; }
    if (a === 'member-detail') { stop(); openMember(id); return; }
    if (a === 'member-edit') { stop(); const purpose = '정보 수정'; const { member } = await api(`/api/members/${id}?purpose=${encodeURIComponent(purpose)}`); closeModal(); modal('인적사항 수정', memberForm(member)); return; }
    if (a === 'user-new') { stop(); modal('사용자 추가', userForm(null)); return; }
    if (a === 'user-edit') { stop(); const { users } = await api('/api/users'); const u = users.find((x) => x.id === id); modal('사용자 수정', userForm(u)); return; }
    if (a === 'user-suspend') { stop(); if (confirm('이 사용자를 정지하시겠습니까? 활성 세션이 즉시 종료됩니다.')) { await api('/api/users/' + id + '/suspend', { method: 'POST' }); toast('정지되었습니다.', 'ok'); renderView(); } return; }
    if (a === 'dept-new') { stop(); modal('부서 추가', deptForm(null)); return; }
    if (a === 'dept-edit') { stop(); const { departments } = await api('/api/departments'); modal('부서 수정', deptForm(departments.find((d) => d.id === id))); return; }
    if (a === 'role-save') { stop(); const card = t.closest('[data-role]'); const perms = [...card.querySelectorAll('[data-perm]:checked')].map((c) => c.dataset.perm); await api('/api/roles/' + id + '/permissions', { method: 'PUT', body: { permissions: perms } }); toast('권한이 저장되었습니다.', 'ok'); return; }
    if (a === 'role-new') { stop(); modal('역할 추가', `<form data-form="role"><label>역할명 <span class="req">*</span></label><input name="name" required /><label>설명</label><input name="description" /><div class="actions"><button class="btn ghost" type="button" data-action="close-modal">취소</button><button class="btn primary" type="submit">추가</button></div></form>`); return; }
  } catch (err) { toast(err.message, 'err'); }
});

function deptForm(d) {
  const v = d || {};
  return `<form data-form="dept" data-id="${v.id || ''}">
    <label>부서명 <span class="req">*</span></label><input name="name" required value="${esc(v.name || '')}" />
    <label>설명</label><input name="description" value="${esc(v.description || '')}" />
    <div class="actions"><button class="btn ghost" type="button" data-action="close-modal">취소</button><button class="btn primary" type="submit">💾 저장</button></div>
  </form>`;
}

boot();
