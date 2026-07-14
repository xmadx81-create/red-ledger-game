// 서버 API 통합 테스트 — 역할별 접근제어를 서버 단계에서 검증.
// 서버를 자식 프로세스로 띄우고 실제 HTTP로 호출한다. (버튼 숨김이 아닌 실제 강제 검증)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 4123;
const BASE = `http://127.0.0.1:${PORT}`;
const PW = 'Test1234!';

let pass = 0, fail = 0;
const results = [];
function check(name, cond) {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name}`); }
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Cookie = `ebts_session=${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, setCookie: res.headers.get('set-cookie') };
}

async function loginAs(email) {
  const res = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PW }) });
  const sc = res.headers.get('set-cookie') || '';
  const m = sc.match(/ebts_session=([^;]+)/);
  return m ? m[1] : null;
}

async function run() {
  // ── 로그인 ──
  const admin = await loginAs('admin@ebts.local');
  check('최고관리자 로그인 성공', !!admin);
  const oilStaff = await loginAs('staff.oil@ebts.local');
  const oilHead = await loginAs('head.oil@ebts.local');
  const strategyStaff = await loginAs('staff.strategy@ebts.local');
  const auditor = await loginAs('auditor@ebts.local');
  const member = await loginAs('member@ebts.local');
  const privacy = await loginAs('privacy@ebts.local');
  check('부서원 로그인 성공', !!oilStaff && !!strategyStaff);

  // 정지 계정 로그인 차단
  const susp = await loginAs('suspended@ebts.local');
  check('정지된 사용자 로그인 차단', !susp);

  // 잘못된 비밀번호
  const bad = await api('/api/login', { method: 'POST', body: { email: 'admin@ebts.local', password: 'wrong' } });
  check('잘못된 비밀번호 401', bad.status === 401);

  // ── 인증 없이 보호 API 접근 차단 ──
  const noAuth = await api('/api/users');
  check('비로그인 사용자 목록 접근 401', noAuth.status === 401);

  // ── 권한 기반 접근제어 (서버 강제) ──
  const adminUsers = await api('/api/users', { token: admin });
  check('관리자 사용자 목록 조회 200', adminUsers.status === 200 && adminUsers.json.users.length >= 8);

  const staffUsers = await api('/api/users', { token: oilStaff });
  check('부서원 사용자 목록 접근 403(권한없음)', staffUsers.status === 403);

  // ── 개인정보 접근제어 (핵심) ──
  const memberList = await api('/api/members', { token: privacy });
  check('개인정보관리자 인적사항 목록 200', memberList.status === 200);
  check('목록은 마스킹됨(이름 마스킹)', memberList.json.members[0].masked === true && memberList.json.members[0].name.includes('*'));

  const staffMemberList = await api('/api/members', { token: oilStaff });
  check('일반 부서원 인적사항 목록 접근 403', staffMemberList.status === 403);

  const memberId = memberList.json.members[0].id;
  // 목적 없이 상세 → 400
  const noPurpose = await api(`/api/members/${memberId}`, { token: privacy });
  check('개인정보 상세 열람 목적 미입력 시 차단', noPurpose.status === 400);
  // 목적 입력 → 200 + 원문
  const detail = await api(`/api/members/${memberId}?purpose=${encodeURIComponent('민원 확인')}`, { token: privacy });
  check('목적 입력 후 상세 열람 200 + 원문', detail.status === 200 && detail.json.masked === false && !detail.json.member.name.includes('*'));

  // 감사자는 목록은 되지만 pii.read 없어 상세 차단
  const auditorDetail = await api(`/api/members/${memberId}?purpose=감사`, { token: auditor });
  check('감사자 개인정보 상세(원문) 403', auditorDetail.status === 403);

  // ── 개인정보 열람이력 기록 확인 ──
  const piiLogs = await api('/api/audit/pii', { token: auditor });
  check('개인정보 열람이력이 감사자에게 조회됨', piiLogs.status === 200 && piiLogs.json.logs.some((l) => l.member_id === memberId && l.purpose === '민원 확인'));
  const privacyAudit = await api('/api/audit/pii', { token: privacy });
  check('개인정보관리자는 일반 감사 로그 권한 없음', (await api('/api/audit/activity', { token: privacy })).status === 403);

  // ── 업무일지 공개범위 (서버 필터) ──
  const oilLogs = await api('/api/work-logs', { token: oilStaff });
  const stratLogs = await api('/api/work-logs', { token: strategyStaff });
  check('석유사업부원은 석유 업무일지를 봄', oilLogs.json.work_logs.some((w) => w.department_id === 'dept_oil'));
  check('석유사업부원은 전략기획 부서전용 일지를 못 봄',
    !oilLogs.json.work_logs.some((w) => w.department_id === 'dept_strategy' && w.visibility === 'department'));
  check('전략기획부원은 staff공개 전사 공지를 봄', stratLogs.json.work_logs.some((w) => w.visibility === 'staff'));

  // 관리자/감사자는 read_all
  const auditLogsAll = await api('/api/work-logs', { token: auditor });
  check('감사자는 전 부서 업무일지 조회(read_all)', auditLogsAll.json.work_logs.length >= oilLogs.json.work_logs.length);

  // ── 업무일지 작성 + 낙관적 잠금 ──
  const created = await api('/api/work-logs', { token: oilStaff, method: 'POST', body: { title: '테스트 업무', visibility: 'department' } });
  check('부서원 업무일지 작성 201/ok', created.status === 200 && created.json.ok);
  const wlId = created.json.id;
  const got = await api(`/api/work-logs/${wlId}`, { token: oilStaff });
  check('작성 직후 version=1', got.json.work_log.version === 1);
  // 정상 수정
  const upd = await api(`/api/work-logs/${wlId}`, { token: oilStaff, method: 'PATCH', body: { title: '수정됨', version: 1 } });
  check('버전 일치 수정 성공 → version 2', upd.status === 200 && upd.json.version === 2);
  // 낡은 버전으로 수정 → 409 충돌
  const stale = await api(`/api/work-logs/${wlId}`, { token: oilStaff, method: 'PATCH', body: { title: '충돌', version: 1 } });
  check('낡은 버전 수정 시 409 충돌 감지', stale.status === 409);

  // 다른 부서원이 남의 부서전용 일지 직접 접근 차단
  const foreign = await api(`/api/work-logs/${wlId}`, { token: strategyStaff });
  check('타 부서원이 부서전용 일지 직접 접근 403/404', foreign.status === 403 || foreign.status === 404);

  // ── 삭제 권한: 부서원은 삭제 불가, 부서장은 소프트 삭제 가능 ──
  const staffDel = await api(`/api/work-logs/${wlId}`, { token: oilStaff, method: 'DELETE' });
  check('부서원은 업무일지 삭제 권한 없음(403)', staffDel.status === 403);
  const del = await api(`/api/work-logs/${wlId}`, { token: oilHead, method: 'DELETE' });
  check('부서장 소프트 삭제 성공', del.status === 200);
  const afterDel = await api(`/api/work-logs/${wlId}`, { token: oilHead });
  check('삭제 후 조회 404', afterDel.status === 404);

  // ── 대시보드 권한 필터 ──
  const memDash = await api('/api/dashboard', { token: member });
  check('일반 조합원 대시보드에 사용자수/개인정보수 미노출', memDash.json.cards.user_count === undefined && memDash.json.cards.member_count === undefined);
  const adminDash = await api('/api/dashboard', { token: admin });
  check('관리자 대시보드에 사용자수 노출', adminDash.json.cards.user_count >= 8);

  // ── 로그아웃 후 세션 무효화 ──
  await api('/api/logout', { token: oilStaff, method: 'POST' });
  const afterLogout = await api('/api/me', { token: oilStaff });
  check('로그아웃 후 세션 무효화(401)', afterLogout.status === 401);

  console.log('\n' + results.join('\n'));
  console.log(`\n결과: ${pass} 통과 / ${fail} 실패\n`);
  return fail === 0;
}

// 서버 기동 후 테스트
const srv = spawn('node', ['--experimental-sqlite', join(__dirname, '..', 'server', 'index.mjs')], {
  env: { ...process.env, PORT: String(PORT), EBTS_DB_PATH: join(__dirname, '..', 'data', 'ebts.db') },
  stdio: ['ignore', 'pipe', 'inherit'],
});
srv.stdout.on('data', () => {});
await new Promise((r) => setTimeout(r, 800));
let okAll = false;
try { okAll = await run(); } catch (e) { console.error('테스트 오류:', e); }
srv.kill();
process.exit(okAll ? 0 : 1);
