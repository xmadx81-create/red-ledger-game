// 실제 브라우저(UI) 구동 테스트 — 로그인→대시보드→업무일지→개인정보 열람까지 실제 클릭
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://localhost:4000';
const EXE = '/opt/pw-browsers/chromium';
const shots = process.env.SHOT_DIR || '/tmp';

let browser;
try {
  browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
} catch {
  browser = await chromium.launch({ args: ['--no-sandbox'] });
}
const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
const log = [];
const ok = (n, c) => log.push((c ? '  ✅ ' : '  ❌ ') + n);

// 1) 로그인 화면
await page.goto(BASE, { waitUntil: 'networkidle' });
ok('로그인 화면 표시', await page.locator('text=EBTS 통합업무포털').first().isVisible());
await page.fill('input[name=email]', 'admin@ebts.local');
await page.fill('input[name=password]', 'Test1234!');
await page.click('button[type=submit]');
await page.waitForSelector('.sidebar', { timeout: 5000 });
ok('로그인 후 대시보드 셸 렌더', await page.locator('.brand').isVisible());
await page.screenshot({ path: shots + '/ebts-01-dashboard.png' });

// 2) 관리자 네비 항목(사용자 관리, 역할·권한) 노출
ok('관리자 사이드바에 역할·권한 메뉴', await page.locator('[data-nav=roles]').count() === 1);

// 3) 업무일지 → 새 업무일지 작성
await page.click('[data-nav="work-logs"]');
await page.waitForSelector('table');
ok('업무일지 목록 표시', (await page.locator('table tbody tr').count()) >= 1);
await page.click('[data-action=wl-new]');
await page.waitForSelector('.modal');
await page.fill('.modal input[name=title]', 'UI 테스트 업무일지');
await page.fill('.modal textarea[name=content]', '브라우저로 생성한 업무일지');
await page.click('.modal button[type=submit]');
await page.waitForSelector('.modal', { state: 'detached', timeout: 5000 });
await page.waitForTimeout(300);
ok('새 업무일지가 목록에 추가됨', await page.locator('text=UI 테스트 업무일지').first().isVisible());
await page.screenshot({ path: shots + '/ebts-02-worklogs.png' });

// 4) 조합원 인적사항 → 마스킹 목록 → 목적 입력 후 상세
await page.click('[data-nav="members"]');
await page.waitForSelector('table');
const masked = await page.locator('table tbody tr td:nth-child(2) b').first().innerText();
ok('인적사항 이름 마스킹(*) 표시', masked.includes('*'));
page.once('dialog', (d) => d.accept('민원 확인'));
await page.click('[data-action=member-detail]');
await page.waitForSelector('.modal');
ok('열람 목적 입력 후 상세(원문) 표시', await page.locator('.modal .pii').first().isVisible());
await page.screenshot({ path: shots + '/ebts-03-member-detail.png' });
await page.click('[data-action=close-modal]');

// 5) 역할·권한 화면
await page.click('[data-nav="roles"]');
await page.waitForSelector('.perm-grid');
ok('역할·권한 편집 화면 표시', (await page.locator('[data-role]').count()) >= 5);
await page.screenshot({ path: shots + '/ebts-04-roles.png' });

// 6) 감사 로그(개인정보 열람이력 기록 확인)
await page.click('[data-nav="audit"]');
await page.waitForSelector('table');
await page.click('text=개인정보 열람이력');
await page.waitForTimeout(400);
ok('개인정보 열람이력에 방금 열람 기록 존재', await page.locator('text=민원 확인').first().isVisible());
await page.screenshot({ path: shots + '/ebts-05-audit-pii.png' });

// 7) 부서원 로그인 시 관리 메뉴 미노출(권한별 메뉴 차등)
await page.click('[data-action=logout]');
await page.waitForSelector('input[name=email]');
await page.fill('input[name=email]', 'staff.oil@ebts.local');
await page.fill('input[name=password]', 'Test1234!');
await page.click('button[type=submit]');
await page.waitForSelector('.sidebar');
ok('부서원에게 사용자 관리 메뉴 미노출', (await page.locator('[data-nav=users]').count()) === 0);
ok('부서원에게 인적사항 메뉴 미노출', (await page.locator('[data-nav=members]').count()) === 0);
await page.screenshot({ path: shots + '/ebts-06-staff-view.png' });

console.log('\n' + log.join('\n'));
const failed = log.filter((l) => l.includes('❌')).length;
console.log(`\nUI 결과: ${log.length - failed} 통과 / ${failed} 실패\n`);
await browser.close();
process.exit(failed ? 1 : 0);
