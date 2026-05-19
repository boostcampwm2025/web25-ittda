import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const RECORD_TITLE = 'E2E 공유 테스트 기록';

test.describe('기록 공유', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const record = await createTestRecord(page, RECORD_TITLE);
    postId = record.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('공유 버튼으로 drawer를 열고 공유 URL로 인증 없이 기록 전체 내용을 확인할 수 있다(작성자 섹션 제외)', async ({ page, browser }) => {
    await page.goto(`/record/${postId}`);
    await expect(page.getByRole('heading', { name: RECORD_TITLE })).toBeVisible({ timeout: 15000 });

    // MoreHorizontal 메뉴 버튼 클릭 → Popover 열기
    // header 안에는 Back 버튼(왼쪽)과 PopoverTrigger(오른쪽) 두 개만 존재
    await page.locator('header').getByRole('button').last().click();

    // Popover가 열릴 때까지 대기 후 "공유하기" 클릭
    const shareMenuItem = page.getByText('공유하기').first();
    await expect(shareMenuItem).toBeVisible({ timeout: 10000 });
    await shareMenuItem.click();

    // SocialShareDrawer 안의 share URL span 대기
    // path = `${window.location.origin}/share/${shareToken}`
    const shareUrlSpan = page.locator('span').filter({ hasText: /\/share\// }).first();
    await expect(shareUrlSpan).toBeVisible({ timeout: 10000 });

    const shareUrl = (await shareUrlSpan.textContent()) ?? '';
    expect(shareUrl).toMatch(/\/share\//);

    // 인증 없는 새 컨텍스트로 공유 URL 접근
    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();

    try {
      await publicPage.goto(shareUrl);

      // 기록 제목 확인 — SharedRecordContent: <h1>{data.title}</h1>
      await expect(publicPage.getByRole('heading', { name: RECORD_TITLE })).toBeVisible({ timeout: 8000 });

      // 기록 내용(TEXT 블록) 확인
      await expect(publicPage.getByText('E2E 테스트 내용입니다.')).toBeVisible();

      // 작성자 섹션은 공유 페이지에 없어야 함
      await expect(publicPage.getByRole('heading', { name: '작성자' })).not.toBeVisible();
    } finally {
      await publicCtx.close();
    }
  });
});
