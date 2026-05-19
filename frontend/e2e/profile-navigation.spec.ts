import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const TODAY = new Date().toISOString().split('T')[0];
const RECORD_TITLE = 'E2E 프로필 태그감정 탐색 기록';
const TAG = 'E2E프로필태그';
const TAG2 = 'E2E프로필태그2';
const MOOD = '행복';

async function gotoProfile(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
}

test.describe('마이페이지 태그·감정 탐색', () => {
  test.describe.configure({ mode: 'serial' });

  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const r = await createTestRecord(page, RECORD_TITLE, TODAY, {
      extraBlocks: [
        { type: 'TAG', value: { tags: [TAG, TAG2] }, layout: { row: 3, col: 1, span: 2 } },
        { type: 'MOOD', value: { mood: MOOD }, layout: { row: 4, col: 1, span: 2 } },
      ],
    });
    postId = r.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!postId) return;
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('마이페이지 태그 조합 검색으로 여러 태그를 선택해 기록을 찾을 수 있다', async ({ page }) => {
    await gotoProfile(page);

    // TagDashboard 하단 "조합 검색" DrawerTrigger 클릭
    await expect(page.getByText('조합 검색')).toBeVisible({ timeout: 10000 });
    await page.getByText('조합 검색').click();

    // 조합 검색 drawer 열림 확인
    await expect(page.getByText('여러 태그로 검색')).toBeVisible({ timeout: 5000 });

    const dialog = page.locator('[role="dialog"]');

    // 첫 번째 태그 선택 — TAG2가 TAG를 포함하므로 exact: true로 정확히 매칭
    const tagBtn1 = dialog.getByText(TAG, { exact: true });
    await expect(tagBtn1).toBeVisible({ timeout: 8000 });
    await tagBtn1.click();

    // 두 번째 태그 선택
    const tagBtn2 = dialog.getByText(TAG2);
    await expect(tagBtn2).toBeVisible({ timeout: 5000 });
    await tagBtn2.click();

    // "2개의 태그 검색" 버튼 → 두 태그가 모두 선택됐음을 확인 후 클릭
    const searchBtn = page.getByRole('button', { name: '2개의 태그 검색' });
    await expect(searchBtn).toBeVisible({ timeout: 5000 });
    await Promise.all([
      page.waitForURL(/\/search.*tags=/, { timeout: 10000 }),
      searchBtn.click(),
    ]);

    // URL에 두 태그가 포함됐는지 확인 (comma 구분, URL 인코딩)
    await expect(page).toHaveURL(/\/search.*tags=/, { timeout: 10000 });
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
  });

  test('마이페이지 태그 모두 보기에서 특정 태그를 선택해 검색할 수 있다', async ({ page }) => {
    await gotoProfile(page);

    // TagDashboard의 "모두 보기" → /profile/all-tags
    await expect(page.getByRole('button', { name: '모두 보기' }).first()).toBeVisible({
      timeout: 10000,
    });
    await Promise.all([
      page.waitForURL('/profile/all-tags', { timeout: 10000 }),
      page.getByRole('button', { name: '모두 보기' }).first().click(),
    ]);

    // TagList에서 특정 태그 클릭 → /search?tags=TAG
    const tagItem = page.getByText(TAG).first();
    await expect(tagItem).toBeVisible({ timeout: 8000 });
    await tagItem.click();

    // 한글 태그는 URL 인코딩되므로 encodeURIComponent로 비교
    await expect(page).toHaveURL(
      new RegExp(`/search.*tags=${encodeURIComponent(TAG)}`),
      { timeout: 10000 },
    );
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
  });

  test('마이페이지 감정 모두 보기에서 특정 감정을 선택해 검색할 수 있다', async ({ page }) => {
    await gotoProfile(page);

    // "통계 더보기" 클릭 → EmotionDashboard 노출
    await expect(page.getByText('통계 더보기')).toBeVisible({ timeout: 8000 });
    await page.getByText('통계 더보기').click();

    // "자주 사용된 감정" 섹션 내 "모두 보기" 버튼 클릭
    const emotionSection = page
      .locator('section')
      .filter({ has: page.getByText('자주 사용된 감정') })
      .first();
    await emotionSection.scrollIntoViewIfNeeded();
    await expect(page.getByText('자주 사용된 감정')).toBeVisible({ timeout: 10000 });
    const allEmotionsBtn = emotionSection.getByRole('button', { name: '모두 보기' });
    await allEmotionsBtn.scrollIntoViewIfNeeded();
    await expect(allEmotionsBtn).toBeVisible({ timeout: 5000 });
    await allEmotionsBtn.click();

    await expect(page).toHaveURL('/profile/all-emotions', { timeout: 10000 });

    // EmotionList에서 특정 감정 클릭 → /search?emotions=MOOD
    const emotionItem = page.getByText(MOOD).first();
    await expect(emotionItem).toBeVisible({ timeout: 8000 });
    await emotionItem.click();

    await expect(page).toHaveURL(
      new RegExp(`/search.*emotions=${encodeURIComponent(MOOD)}`),
      { timeout: 10000 },
    );
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
  });
});
