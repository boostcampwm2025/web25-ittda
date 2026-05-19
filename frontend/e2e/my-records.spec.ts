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
    await Promise.all([
      page.waitForURL(/\/my\/month\/.+/, { timeout: 10000 }),
      monthCard.click(),
    ]);
  });

  test('월별 상세에서 날짜를 클릭하면 날짜 상세 페이지로 이동한다', async ({ page }) => {
    await page.goto(`/my/month/${CURRENT_YEAR}-${CURRENT_MONTH}`);
    // DateRecordCard → PostCard → div[role="button"]
    // 날짜 배지(span)에 오늘 날짜 숫자가 정확히 있는 카드를 클릭
    const todayDay = new Date().getDate().toString();
    const dateCard = page.getByRole('button').filter({
      has: page.locator('span').filter({ hasText: new RegExp(`^${todayDay}$`) }),
    }).first();
    await expect(dateCard).toBeVisible({ timeout: 8000 });
    await dateCard.click();
    await expect(page).toHaveURL(/\/my\/detail\/.+/);
  });

  test('날짜 상세 페이지에서 기록 카드를 클릭하면 기록 상세로 이동한다', async ({ page }) => {
    await page.goto(`/my/detail/${TODAY}`);
    // DailyDetailRecordItem → div[onClick, class*="cursor-pointer"] 렌더링
    const recordCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: 'E2E 월별 조회 테스트 기록' }).first();
    await expect(recordCard).toBeVisible({ timeout: 8000 });
    await recordCard.click();

    // /record/[id]로 이동하면 성공
    await expect(page).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 10000 });
  });
});
