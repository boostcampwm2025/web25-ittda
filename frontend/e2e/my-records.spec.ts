import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const TODAY = new Date().toISOString().split('T')[0];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = String(new Date().getMonth() + 1).padStart(2, '0');

test.describe('개인 기록 조회', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const record = await createTestRecord(page, 'E2E 월별 조회 테스트 기록');
    postId = record.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('내 기록 페이지(/my)가 로드된다', async ({ page }) => {
    await page.goto('/my');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL('/my');
  });

  test('월별 기록 카드가 표시된다', async ({ page }) => {
    await page.goto('/my');
    // MonthCard → PostCard → div[role="button"] 렌더링
    const monthCard = page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }).first();
    await expect(monthCard).toBeVisible({ timeout: 8000 });
  });

  test('월 카드를 클릭하면 월별 상세 페이지로 이동한다', async ({ page }) => {
    await page.goto('/my');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    const monthCard = page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }).first();
    await expect(monthCard).toBeVisible({ timeout: 8000 });
    await monthCard.click();
    // router.push는 history.pushState로 동작 → waitForFunction으로 URL 직접 확인
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/my/month/'),
      { timeout: 10000 },
    );
  });

  test('월별 상세에서 날짜를 클릭하면 날짜 상세 페이지로 이동한다', async ({ page }) => {
    await page.goto(`/my/month/${CURRENT_YEAR}-${CURRENT_MONTH}`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    // DateRecordCard는 날짜별 카드 — 타이틀이 아닌 '일별 기록 보기' 텍스트로 특정
    const dateCard = page.getByRole('button').filter({ hasText: '일별 기록 보기' }).first();
    await expect(dateCard).toBeVisible({ timeout: 8000 });
    await dateCard.click();
    // router.push는 history.pushState로 동작 → waitForFunction으로 URL 직접 확인
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/my/detail/'),
      { timeout: 10000 },
    );
  });

  test('날짜 상세 페이지에서 기록 카드를 클릭하면 기록 상세로 이동한다', async ({ page }) => {
    await page.goto(`/my/detail/${TODAY}`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    // DailyDetailRecordItem → div[onClick, class*="cursor-pointer"] 렌더링
    const recordCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: 'E2E 월별 조회 테스트 기록' }).first();
    await expect(recordCard).toBeVisible({ timeout: 8000 });
    await recordCard.click();

    // router.push는 history.pushState로 동작 → waitForFunction으로 URL 직접 확인
    await page.waitForFunction(
      () => /\/record\/[a-z0-9-]+/.test(window.location.pathname),
      { timeout: 10000 },
    );
  });
});
