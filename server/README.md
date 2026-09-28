# 회원 인증 서버 (`server/`)

「헌혈의 집」 홈페이지의 회원가입·로그인·로그인 유지·로그아웃을 처리하는 Node.js 서버입니다.
설계 배경과 보안 기준은 [`docs/system-design/AUTH_SYSTEM_001.md`](../docs/system-design/AUTH_SYSTEM_001.md)를 참고합니다.

## 1. 실행

필요 환경: **Node.js 22.9 이상**, npm

```bash
cd server
npm install        # 최초 1회
npm run dev        # 개발 실행(파일 변경 시 자동 재시작) → http://localhost:3000
npm start          # 일반 실행
npm test           # 자동 테스트(인증 API·DB 제약·세션 만료·입력 검증)
```

저장소 루트에서도 실행할 수 있습니다: `npm run auth:install`, `npm run auth:dev`, `npm run auth:test`

- 회원 DB는 첫 실행 때 `server/data/app.db`(SQLite)로 자동 생성됩니다. Git에는 올라가지 않습니다.
- 환경 변수는 `.env.example`을 `.env`로 복사해 수정합니다.

## 2. 화면

| 주소 | 설명 | 접근 |
|---|---|---|
| `/` | 로그인 여부에 따라 `/dashboard` 또는 `/login`으로 이동 | 누구나 |
| `/signup` | 회원가입 (이름·이메일·비밀번호·비밀번호 확인) | 비로그인 (로그인 상태면 대시보드로) |
| `/login` | 로그인 (이메일·비밀번호) | 비로그인 (로그인 상태면 대시보드로) |
| `/dashboard` | 회원 이름·환영 문구·로그아웃·향후 기능 영역 | **로그인 필요** (서버에서 확인) |

## 3. API

모든 요청·응답은 JSON입니다. 오류 형식: `{ "error": { "code", "message", "fields"? } }`

| 메서드 | 경로 | 요청 | 성공 | 주요 오류 |
|---|---|---|---|---|
| POST | `/api/auth/signup` | `name, email, password, passwordConfirm` | 201 + 세션 쿠키 | 400 입력 오류(`fields`), 409 이메일 중복, 429 요청 과다 |
| POST | `/api/auth/login` | `email, password` | 200 + 세션 쿠키 | 400 입력 누락, 401 이메일·비밀번호 불일치, 429 시도 과다 |
| POST | `/api/auth/logout` | 없음 | 204 + 쿠키 삭제 | — |
| GET | `/api/auth/me` | 없음 | 200 `{ user }` | 401 로그인 필요 |

## 4. 폴더 구조

```text
server/
├─ src/
│  ├─ index.js          서버 시작(환경 변수·DB 연결·만료 세션 정리)
│  ├─ app.js            Express 앱 조립(보안 헤더·라우터·오류 처리) ← 새 기능 라우터는 여기에 추가
│  ├─ config.js         환경 변수 → 설정값
│  ├─ db.js             SQLite 연결 + 스키마 마이그레이션
│  ├─ http.js           쿠키·세션 확인·CSRF 방어·requireAuth 등 공통 미들웨어
│  ├─ auth/             password.js(Argon2id) · sessions.js · users.js
│  └─ routes/           auth.js(API) · pages.js(화면)
├─ shared/validation.js 입력 검증 규칙 — 브라우저와 서버가 같은 파일 사용
├─ views/               login.html · signup.html · dashboard.html
├─ public/              화면 CSS·JS (/assets/ 로 제공)
└─ test/                node:test 자동 테스트
```

## 5. 기능 확장 방법

로그인한 회원만 쓰는 API를 추가하는 예:

```js
// src/app.js — "향후 홈페이지 기능" 주석 위치
import { requireAuth } from './http.js';
app.use('/api/posts', requireAuth, postsRouter); // 라우터 안에서 req.auth.user 로 회원 정보 사용
```

- DB 테이블 추가는 `src/db.js`의 `MIGRATIONS` 배열 **끝에** 새 항목을 추가합니다(기존 항목 수정 금지).
- 화면 추가는 `views/`에 HTML, `public/`에 CSS·JS를 두고 `routes/pages.js`에 라우트를 등록합니다.
- 인라인 `<script>`·`style=""`은 보안 정책(CSP)상 동작하지 않으므로 별도 파일로 작성합니다.

## 6. 운영 배포 전 확인

- GitHub Pages는 정적 호스팅이라 **이 서버를 실행할 수 없습니다.** Node.js 실행과 **영구 디스크**가 있는 호스팅이 필요합니다.
- HTTPS 필수. `NODE_ENV=production`, `APP_ORIGIN=https://실제주소`, 프록시 뒤라면 `TRUST_PROXY=1`을 설정합니다.
- `DATABASE_PATH`는 재배포해도 지워지지 않는 경로로 지정하고, DB 파일을 정기 백업합니다.
