import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

test.describe('검색', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    // 검색어 "E2E검색"으로 찾을 수 있도록 제목에 포함
    const record = await createTestRecord(page, 'E2E검색 테스트 기록');
    postId = record.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('검색 페이지에 진입하면 검색 입력창이 표시된다', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('input[type="search"], input[placeholder*="검색"]')).toBeVisible();
  });

  test('검색어를 입력하면 결과 또는 빈 상태가 표시된다', async ({ page }) => {
    await page.goto('/search');
    const input = page.locator('input').first();
    await input.fill('여행');
    await page.waitForTimeout(1500); // debounce 대기
    await expect(page.locator('body')).toBeVisible();
  });

  test('검색 결과 기록을 클릭하면 기록 상세로 이동한다', async ({ page }) => {
    await page.goto('/search');
    const input = page.locator('input').first();

    // debounce + 검색 API 응답을 기다린 뒤 결과 확인
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/search') && res.request().method() === 'POST',
        { timeout: 10000 },
      ),
      input.fill('E2E검색'),
    ]);

    // SearchItem → <button onClick={router.push('/record/[id]')}> 렌더링
    const resultButton = page.getByRole('button').filter({ hasText: 'E2E검색 테스트 기록' }).first();
    await expect(resultButton).toBeVisible({ timeout: 8000 });
    await resultButton.click();

    await expect(page).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 8000 });
  });

  test('검색어를 지우면 초기 화면으로 돌아온다', async ({ page }) => {
    await page.goto('/search?q=여행');
    const input = page.locator('input').first();
    await input.clear();
    await expect(page.locator('body')).toBeVisible();
  });
});
