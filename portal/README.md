# EBTS 통합업무포털 (MVP)

각 부서가 PC 공용폴더·개인PC·메신저·엑셀로 분산 관리하던 업무자료를 **웹 브라우저 한 곳**에서
처리하도록 만든 통합 업무 앱입니다. 로그인·권한·데이터 저장·감사 로그·개인정보 접근통제가
**실제로 동작**하는 실행 가능한 MVP입니다. (기획서/목업이 아닙니다.)

> 이 포털은 게임 저장소(`red-ledger-game`) 안의 독립 하위 프로젝트 `portal/` 로 구현되었습니다.
> 기존 게임 코드는 전혀 건드리지 않았습니다.

---

## 1. 프로젝트 목적
- 최신/이전 파일 구분, 중복 파일, 담당자 부재 시 자료 실종, 권한 미구분 문제 해결
- 부서별 업무일지·업무현황 공유, 조합원 인적사항의 **열람 범위 통제**
- 모든 주요 데이터에 작성자·수정자·일시 기록, 중요정보 CRUD **감사 로그**

## 2. 주요 기능 (MVP 구현 완료)
- 초기 관리자 설정 → 로그인(세션 쿠키, 실패 잠금) → 로그아웃
- 역할 6종 + **세분화 권한 18종**, 서버·DB 단계 권한 강제(RLS 대응)
- 사용자 관리(생성/수정/정지/삭제/개별권한), 부서 관리, 역할·권한 편집
- 권한별 대시보드(권한 없는 정보는 표시 안 함)
- 업무일지 작성·조회·수정(**낙관적 잠금으로 동시수정 충돌 감지**)·승인·소프트삭제, 공개범위 필터
- 조합원 인적사항: **목록 마스킹 + 목적 입력 후 원문 열람 + 열람이력 기록**
- 감사 로그(활동/개인정보 열람이력) 읽기 전용 조회, 사용량·저장공간 조회

구현하지 못한 범위(파일함/매뉴얼/칸반/알림 등)는 `docs/ROADMAP_UNDONE.md` 에 정리했습니다.

## 3. 기술 스택과 선정 이유

| 구분 | 선택 | 이유 |
|---|---|---|
| 실행 런타임 | **Node.js 22 (`node:sqlite`, `node:http`, `crypto`)** | 외부 의존성 0개 → 어떤 환경에서도 즉시 실행. 클라우드 프로비저닝 없이 "실제 서버 DB + 서버 권한강제"를 증명 |
| DB | **SQLite** (참조 MVP) → **PostgreSQL/Supabase** (프로덕션 목표) | 스키마를 PostgreSQL 이식 가능하게 설계. `docs/DATABASE.md` 참조 |
| 인증 | 자체 세션 + **scrypt 해시**(평문 저장 금지) | 업무용 계정 관리에 소셜로그인보다 명확 |
| 프론트 | 순수 HTML/CSS/JS SPA (빌드 불필요) | 저장소 기존 스타일과 일치, 설치 없이 브라우저 접속 |

**왜 Supabase를 "지금 바로" 쓰지 않았나:** 이 실습 환경에는 라이브 Supabase 프로젝트 자격증명이
없어, 지금 당장 `실제 로그인·실제 저장·새로고침 후 유지·다중 브라우저 반영`을 **증명 가능한
형태로** 보여주려면 프로비저닝이 필요 없는 서버 DB가 필요했습니다. 그래서 참조 MVP는
무의존성 Node+SQLite로 만들되, **동일한 스키마·동일한 권한 모델**을 PostgreSQL로 이식하도록
설계했습니다(`docs/DATABASE.md`의 이식 매핑, `docs/ARCHITECTURE.md`의 전환 계획).

**제외한 대안:**
- **Firebase(Firestore)** — 실시간·인증·무료범위 우수하나 관계형 권한(부서×역할×공개범위)과
  RLS급 행단위 통제를 SQL로 표현하기 어렵고, 데이터 이전/종속 위험이 큼 → 제외.
- **브라우저 localStorage** — 요구사항이 명시적으로 금지(서버 DB 저장). 참조 MVP는 서버 SQLite 사용.

클라우드 무료범위·요금은 추측하지 않고 공식 출처·확인일자와 함께 `docs/COST_ESTIMATE.md`에 기록.

## 4. 로컬 실행 방법

```bash
# 저장소 루트에서
npm run portal:seed     # DB 생성 + 테스트 계정/샘플 데이터 시드
npm run portal          # 서버 실행 → http://localhost:4000
```
> Node 22의 내장 SQLite를 쓰므로 `--experimental-sqlite` 플래그가 필요하며, npm 스크립트에 포함되어 있습니다.
> 별도 `npm install` 없이도 동작합니다(테스트용 브라우저 자동화만 `playwright-core` 선택 설치).

## 5. 환경변수 설정
`portal/.env.example` 참고. 참조 MVP는 `PORT`, `EBTS_DB_PATH`, `EBTS_SEED_PW`만 사용합니다.
실제 비밀값은 `.env`(gitignore됨)에 둡니다.

## 6. 데이터베이스 구성
`portal/migrations/001_init.sql` 이 스키마·인덱스를 생성하고, 서버 기동/시드 시 자동 적용됩니다.
역할·권한은 코드(`portal/server/rbac.mjs`)가 원천이며 매 기동 시 upsert됩니다.

## 7. 테스트 계정 (개발 전용 · 가상 데이터)
`npm run portal:seed` 실행 시 아래 계정이 생성됩니다. **비밀번호는 모두 `Test1234!`**
(운영 배포 전 반드시 변경). 자세한 검증 시나리오는 `docs/PERMISSIONS.md`.

| 이메일 | 역할 | 부서 |
|---|---|---|
| admin@ebts.local | 최고관리자 | - |
| privacy@ebts.local | 개인정보관리자 | 전략기획실 |
| head.strategy@ebts.local | 부서장 | 전략기획실 |
| staff.strategy@ebts.local | 부서원 | 전략기획실 |
| head.oil@ebts.local | 부서장 | 석유사업부 |
| staff.oil@ebts.local | 부서원 | 석유사업부 |
| auditor@ebts.local | 감사·열람 | 감사실 |
| member@ebts.local | 일반 조합원 | - |
| suspended@ebts.local | (정지됨) | 석유사업부 |

## 8. 테스트 실행
```bash
npm run portal:test           # 서버 API 통합 테스트(역할별 접근제어 30개 검증)
node portal/tests/ui-test.mjs # 실제 브라우저 UI 흐름 11개 검증(서버 실행 중이어야 함)
```

## 9. 배포 방법
`docs/DEPLOYMENT.md` 참조. 참조 MVP는 Node 프로세스로 어디서든 배포 가능하며,
프로덕션 목표(Supabase+Vercel/Next.js) 전환 절차도 함께 문서화했습니다.

## 10. 현재 구현 범위 / 알려진 제한사항
- **구현:** 인증·RBAC·부서·사용자·대시보드·업무일지·인적사항(개인정보 통제)·감사 로그·사용량
- **제한:** 파일함/매뉴얼/업무 칸반·캘린더/알림/공지사항/엑셀 입출력은 미구현 → `docs/ROADMAP_UNDONE.md`
- 참조 MVP의 실시간 갱신은 폴링/새로고침 기반(웹소켓 미적용). 프로덕션은 Supabase Realtime 권장.

## 문서
`docs/` 폴더: REQUIREMENTS · ARCHITECTURE · DATABASE · PERMISSIONS · SECURITY ·
COST_ESTIMATE · DEPLOYMENT · USER_GUIDE · ADMIN_GUIDE · TEST_PLAN · CHANGELOG · ROADMAP_UNDONE
