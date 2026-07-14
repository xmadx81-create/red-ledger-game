// 테스트용 시드 데이터 — 개발 환경 전용. 운영 배포 전 반드시 비밀번호 변경.
// 실제 주민등록번호/계좌/민감정보는 사용하지 않으며 모두 가상 데이터입니다.
import { db, migrate } from './db.mjs';
import { hashPassword, uuid } from './auth.mjs';

migrate();

const TEST_PW = process.env.EBTS_SEED_PW || 'Test1234!';

const departments = [
  ['dept_strategy', '전략기획실'],
  ['dept_oil', '석유사업부'],
  ['dept_franchise', '가맹관리부'],
  ['dept_media', '미디어·홍보부'],
  ['dept_audit', '감사실'],
  ['dept_it', '전산·개발'],
];
const positions = [
  ['pos_exec', '임원', 10], ['pos_head', '실장/부장', 20], ['pos_mgr', '차장/과장', 30], ['pos_staff', '사원', 40],
];

function upsertDept(id, name) {
  db.prepare("INSERT INTO departments(id,name,created_by) VALUES(?,?,'system') ON CONFLICT(id) DO UPDATE SET name=excluded.name").run(id, name);
}
function upsertPos(id, name, rank) {
  db.prepare('INSERT INTO positions(id,name,rank) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name').run(id, name, rank);
}
for (const [id, name] of departments) upsertDept(id, name);
for (const [id, name, rank] of positions) upsertPos(id, name, rank);

// 테스트 계정: [email, name, role, dept, position, status]
const users = [
  ['admin@ebts.local',        '최고관리자',        'super_admin',     null,             'pos_exec',  'active'],
  ['privacy@ebts.local',      '개인정보관리자',     'privacy_officer', 'dept_strategy',  'pos_head',  'active'],
  ['head.strategy@ebts.local','전략기획실 부서장',  'dept_head',       'dept_strategy',  'pos_head',  'active'],
  ['staff.strategy@ebts.local','전략기획실 부서원', 'dept_member',     'dept_strategy',  'pos_staff', 'active'],
  ['head.oil@ebts.local',     '석유사업부 부서장',  'dept_head',       'dept_oil',       'pos_head',  'active'],
  ['staff.oil@ebts.local',    '석유사업부 부서원',  'dept_member',     'dept_oil',       'pos_staff', 'active'],
  ['auditor@ebts.local',      '감사실 열람자',      'auditor',         'dept_audit',     'pos_mgr',   'active'],
  ['member@ebts.local',       '일반 조합원',        'member',          null,             null,        'active'],
  ['suspended@ebts.local',    '정지된 사용자',      'dept_member',     'dept_oil',       'pos_staff', 'suspended'],
];

const userIds = {};
for (const [email, name, role, dept, pos, status] of users) {
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  const id = existing?.id || uuid();
  userIds[email] = id;
  if (existing) {
    db.prepare('UPDATE users SET full_name=?,role_id=?,department_id=?,position_id=?,status=?,password_hash=? WHERE id=?')
      .run(name, role, dept, pos, status, hashPassword(TEST_PW), id);
  } else {
    db.prepare(`INSERT INTO users(id,email,password_hash,full_name,role_id,department_id,position_id,status,created_by)
                VALUES(?,?,?,?,?,?,?,?,'system')`).run(id, email, hashPassword(TEST_PW), name, role, dept, pos, status);
  }
}
// 부서장 지정
db.prepare('UPDATE departments SET head_user_id=? WHERE id=?').run(userIds['head.strategy@ebts.local'], 'dept_strategy');
db.prepare('UPDATE departments SET head_user_id=? WHERE id=?').run(userIds['head.oil@ebts.local'], 'dept_oil');

// 샘플 업무일지
const wl = (title, dept, author, assignee, status, vis) => {
  const id = uuid();
  db.prepare(`INSERT INTO work_logs(id,title,content,status,priority,department_id,assignee_id,work_date,visibility,version,created_by,updated_by)
              VALUES(?,?,?,?,'normal',?,?,date('now'),?,1,?,?)`)
    .run(id, title, title + ' 상세 내용(샘플).', status, dept, assignee, vis, author, author);
};
if (db.prepare('SELECT COUNT(*) c FROM work_logs').get().c === 0) {
  wl('전략기획 주간 보고', 'dept_strategy', userIds['head.strategy@ebts.local'], userIds['staff.strategy@ebts.local'], 'in_progress', 'department');
  wl('석유사업 재고 점검', 'dept_oil', userIds['head.oil@ebts.local'], userIds['staff.oil@ebts.local'], 'review', 'department');
  wl('전사 공지: 보안 교육', 'dept_strategy', userIds['admin@ebts.local'], null, 'done', 'staff');
  wl('석유사업부 내부 회의록', 'dept_oil', userIds['staff.oil@ebts.local'], userIds['staff.oil@ebts.local'], 'planned', 'department');
}

// 샘플 조합원 인적사항 (가상 데이터)
const mem = (mgmt, name, type, aff, region, phone, birth) => {
  const id = uuid();
  db.prepare(`INSERT INTO member_profiles(id,mgmt_no,name,member_type,affiliation,region_hq,phone,email,birth_date,join_date,member_status,address,created_by,updated_by)
              VALUES(?,?,?,?,?,?,?,?,?,date('now'),'active',?,'system','system')`)
    .run(id, mgmt, name, type, aff, region, phone, name.toLowerCase().replace(/\s/g, '') + '@example.com', birth, '서울시 중구 세종대로 1');
};
if (db.prepare('SELECT COUNT(*) c FROM member_profiles').get().c === 0) {
  mem('M0001', '홍길동', '조합원', '서울지부', '수도권본부', '010-1234-5678', '1980-03-15');
  mem('M0002', '김영희', '조합원', '부산지부', '영남본부', '010-2345-6789', '1975-11-02');
  mem('M0003', '박철수', '임직원', '전략기획실', '본사', '010-3456-7890', '1988-07-21');
  mem('M0004', '이순신', '조합원', '대전지부', '충청본부', '010-4567-8901', '1990-01-30');
}

console.log('시드 완료. 테스트 계정 비밀번호:', TEST_PW);
console.log('계정 목록:');
for (const [email, name, role] of users) console.log(`  ${email.padEnd(28)} ${role.padEnd(16)} ${name}`);
