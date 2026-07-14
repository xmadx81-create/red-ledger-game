// EBTS 통합업무포털 — 역할·권한 정의(RBAC 매트릭스)
// 이 파일이 권한의 단일 원천(single source of truth)입니다.
// 서버의 모든 보호된 API는 requirePermission()으로 여기 정의된 권한을 검증합니다.

// 세분화된 권한(permission) 목록
export const PERMISSIONS = [
  // 사용자/계정
  ['user.read',        '사용자 조회',        'user'],
  ['user.manage',      '사용자 생성·수정·정지', 'user'],
  ['role.manage',      '역할·권한 관리',      'user'],
  // 부서
  ['dept.read',        '부서 조회',          'dept'],
  ['dept.manage',      '부서 생성·수정',      'dept'],
  // 업무일지
  ['work_log.read',    '업무일지 조회',       'work_log'],
  ['work_log.write',   '업무일지 작성',       'work_log'],
  ['work_log.update',  '업무일지 수정',       'work_log'],
  ['work_log.delete',  '업무일지 삭제',       'work_log'],
  ['work_log.approve', '업무일지 승인',       'work_log'],
  ['work_log.read_all','전 부서 업무일지 조회', 'work_log'],
  // 개인정보(조합원 인적사항)
  ['member.read',      '인적사항 목록(마스킹) 조회', 'member'],
  ['member.pii.read',  '개인정보 상세(원문) 열람',  'member'],
  ['member.pii.write', '개인정보 수정',       'member'],
  // 감사
  ['audit.read',       '감사 로그 열람',      'audit'],
  ['audit.pii.read',   '개인정보 열람이력 확인', 'audit'],
  // 시스템
  ['system.manage',    '시스템 설정 관리',    'system'],
  ['usage.read',       '사용량·저장공간 조회', 'system'],
];

// 기본 역할 정의 (rank: 낮을수록 상위)
export const ROLES = [
  { id: 'super_admin',    name: '최고관리자',        rank: 10, is_system: 1, description: '전체 시스템 관리' },
  { id: 'privacy_officer',name: '개인정보관리자',     rank: 20, is_system: 1, description: '조합원 개인정보 조회·수정 전담' },
  { id: 'dept_head',      name: '부서장',            rank: 30, is_system: 1, description: '소속 부서 업무 관리·승인' },
  { id: 'dept_member',    name: '부서원',            rank: 40, is_system: 1, description: '소속 부서 업무 작성' },
  { id: 'member',         name: '일반 조합원',        rank: 50, is_system: 1, description: '공개 자료 조회' },
  { id: 'auditor',        name: '감사·열람 사용자',   rank: 45, is_system: 1, description: '읽기 전용 + 감사 로그' },
];

// 역할별 기본 권한 매핑
export const ROLE_PERMISSIONS = {
  super_admin: PERMISSIONS.map((p) => p[0]), // 전체 권한
  privacy_officer: [
    'member.read', 'member.pii.read', 'member.pii.write', 'audit.pii.read',
    'work_log.read', 'dept.read', 'user.read',
  ],
  dept_head: [
    'user.read', 'dept.read',
    'work_log.read', 'work_log.write', 'work_log.update', 'work_log.delete', 'work_log.approve',
    // 개인정보(member.read)는 기본 미포함 — 별도 권한 부여 시에만 조회 가능
  ],
  dept_member: [
    'dept.read', 'work_log.read', 'work_log.write', 'work_log.update',
    // 개인정보는 원칙적으로 조회 불가 — member.read 미포함
  ],
  member: [
    'work_log.read', // 공개 범위 규칙으로 추가 제한됨
  ],
  auditor: [
    'work_log.read', 'work_log.read_all', 'dept.read', 'user.read',
    'member.read', 'audit.read', 'audit.pii.read', 'usage.read',
  ],
};

// 업무일지 공개 범위
export const VISIBILITY = {
  ALL: 'all',                 // 전체 공개
  MEMBERS: 'members',         // 전 조합원 공개
  STAFF: 'staff',             // 임직원 공개
  DEPARTMENT: 'department',   // 특정 부서 공개(작성자 부서)
  AUTHOR_ADMIN: 'author_admin', // 작성자와 관리자만
};

export const VISIBILITY_LABELS = {
  all: '전체 공개',
  members: '전 조합원 공개',
  staff: '임직원 공개',
  department: '부서 공개',
  author_admin: '작성자·관리자만',
};
