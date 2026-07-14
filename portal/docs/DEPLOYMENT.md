# 배포 방법 (DEPLOYMENT)

## A. 참조 MVP 배포 (무의존성 Node — 어디서든)
전제: Node.js 20.5+ (권장 22). 외부 서비스 프로비저닝 불필요.

```bash
# 1) 코드 배치 후 최초 1회 DB 생성 (운영에서는 seed 대신 초기관리자 화면 사용 권장)
EBTS_DB_PATH=/var/data/ebts.db node --experimental-sqlite portal/server/index.mjs
#   → 최초 접속 시 "초기 관리자 설정" 화면에서 최고관리자 생성
# 2) 상시 구동: pm2 / systemd / 컨테이너
PORT=4000 EBTS_DB_PATH=/var/data/ebts.db node --experimental-sqlite portal/server/index.mjs
```
- **HTTPS**: 리버스 프록시(Nginx/Caddy) 뒤에 두고 TLS 종단. 쿠키는 이미 httpOnly/SameSite=Strict,
  운영에서는 `Secure` 속성 추가 권장(코드 상수 `COOKIE` 옵션에 `Secure` 부여).
- **백업**: `EBTS_DB_PATH` 파일 + `-wal`/`-shm`를 정기 복사. 무중단 백업은 SQLite `.backup`.
- **환경변수**: `.env`(gitignore) 관리. 시드 스크립트/테스트 비밀번호는 운영에서 사용 금지.
- **배포 후 점검**: 로그인, 권한별 메뉴, 개인정보 마스킹/열람이력, 감사 로그, 새로고침 후 유지.

## B. 프로덕션 목표 배포 (Supabase + Next.js/Vercel)
1. Supabase 프로젝트 생성 → `migrations/001_init.sql`을 PostgreSQL로 이식 적용(`DATABASE.md` 5장).
2. RLS 정책 적용(`DATABASE.md` 6장), Supabase Auth 연결.
3. 프론트를 Next.js로 이식, `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`는 클라이언트,
   `SERVICE_ROLE_KEY`는 서버 전용 환경변수로 등록(**클라이언트 노출 금지**).
4. Vercel(상업적 사용은 Pro) 또는 자체 호스팅에 배포. 도메인·HTTPS 자동.
5. 초기 관리자 계정 생성 → 배포 주소·HTTPS·기본 보안 점검 → 기능 스모크 테스트.

## C. 롤백/장애 대응
- 배포는 태그/커밋 기준. 문제가 있으면 이전 태그로 롤백.
- DB는 백업 복원 → 마이그레이션 재적용. **운영 DB에 seed 실행 금지.**
