import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const NEW_NICKNAME = 'E2E닉네임변경';
const RECORD_TITLE = 'E2E 닉네임 변경 테스트 기록';

async function getAuthToken(page: import('@playwright/test').Page): Promise<string> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === 'x-guest-access-token')?.value ?? '';
}

test.describe('닉네임 변경 후 기록 상세 반영', () => {
  let postId: string;
  let originalNickname: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const token = await getAuthToken(page);

    // 현재 닉네임 저장 (테스트 후 복원용)
    const meRes = await page.request.get('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meBody = await meRes.json();
    originalNickname = meBody?.data?.user?.nickname ?? 'anonymous';

    // 테스트 기록 생성
    const record = await createTestRecord(page, RECORD_TITLE);
    postId = record.id;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const token = await getAuthToken(page);

    // 닉네임 원래대로 복원
    await page.request.patch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
      data: { nickname: originalNickname },
    });

    // 기록 삭제
    if (postId) await deleteTestRecord(page, postId);

    await ctx.close();
  });

  test('닉네임을 변경하면 기존 기록의 상세 페이지에서 변경된 닉네임이 표시된다', async ({ page }) => {
    const token = await getAuthToken(page);

    // 닉네임 변경
    const patchRes = await page.request.patch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
      data: { nickname: NEW_NICKNAME },
    });
    expect(patchRes.ok()).toBeTruthy();

    // 기록 상세 페이지로 이동
    await page.goto(`/record/${postId}`);

    // 작성자 섹션이 안정화된 뒤 스크롤
    const authorHeading = page.getByRole('heading', { name: '작성자' });
    await expect(authorHeading).toBeVisible({ timeout: 10000 });
    await authorHeading.scrollIntoViewIfNeeded();

    // 변경된 닉네임이 작성자 섹션에 표시되어야 함
    await expect(page.locator('span.font-medium', { hasText: NEW_NICKNAME })).toBeVisible({
      timeout: 5000,
    });
  });
});
