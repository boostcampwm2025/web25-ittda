import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const TODAY = new Date().toISOString().split('T')[0];

test.describe('홈 → 기록 상세 이동', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const record = await createTestRecord(page, 'E2E 홈 테스트 기록');
    postId = record.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('홈 화면이 로드된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/localhost:3000\/?$/);
  });

  test('날짜 상세 페이지에서 기록 카드를 클릭하면 기록 상세로 이동한다', async ({ page }) => {
    await page.goto(`/my/detail/${TODAY}`);

    // DailyDetailRecordItem은 div[onClick]으로 렌더링됨 — 제목으로 찾기
    const recordCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: 'E2E 홈 테스트 기록' }).first();
    await expect(recordCard).toBeVisible({ timeout: 8000 });
    await recordCard.click();

    await expect(page).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 20000 });
  });
});

test.describe('홈 → 개인 기록(/my) 이동', () => {
  test('하단 내 기록 탭을 클릭하면 /my로 이동한다', async ({ page }) => {
    await page.goto('/');

    // <nav> 안의 .bottom-nav 에서 두 번째 버튼(Book 아이콘 = /my)
    const myButton = page.locator('nav .bottom-nav button').nth(1);
    await expect(myButton).toBeVisible({ timeout: 5000 });
    await myButton.click();
    await expect(page).toHaveURL('/my', { timeout: 20000 });
  });
});
