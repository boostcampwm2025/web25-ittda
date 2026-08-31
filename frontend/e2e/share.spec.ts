import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const RECORD_TITLE = 'E2E 공유 페이지 테스트 기록';
const RECORD_TEXT = 'E2E 테스트 내용입니다.';

test.describe('공개 공유 기록 조회', () => {
  let postId: string;
  let shareToken: string;

  test.beforeAll(async ({ browser }) => {
    // 인증된 컨텍스트로 기록 생성 + 공유 링크 발급
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();

    const record = await createTestRecord(page, RECORD_TITLE);
    postId = record.id;

    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === 'x-guest-access-token')?.value ?? '';
    const shareRes = await page.request.post(`/api/posts/${postId}/share`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    });
    const shareBody = await shareRes.json();
    if (!shareBody.success) throw new Error(`공유 링크 생성 실패: ${JSON.stringify(shareBody.error)}`);
    shareToken = shareBody.data.shareToken;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('공유 링크로 기록 제목을 확인할 수 있다', async ({ page }) => {
    // chromium-public 프로젝트 — storageState 없음(비인증 상태)
    await page.goto(`/share/${shareToken}`);
    // SharedRecordContent: <h1>{data.title}</h1>
    await expect(page.getByRole('heading', { name: RECORD_TITLE })).toBeVisible({ timeout: 15000 });
  });

  test('기록 내용이 표시된다', async ({ page }) => {
    await page.goto(`/share/${shareToken}`);
    await expect(page.getByText(RECORD_TEXT)).toBeVisible({ timeout: 15000 });
  });

  test('존재하지 않는 공유 토큰은 에러 상태를 보여준다', async ({ page }) => {
    await page.goto('/share/definitely-not-a-real-token');
    // SharedRecordContent 에러 상태: "공유된 기록을 찾을 수 없어요"
    await expect(page.getByText('공유된 기록을 찾을 수 없어요')).toBeVisible({ timeout: 15000 });
  });

  test('공유를 해제하면 해당 공유 페이지에 접근할 수 없다', async ({ page, browser }) => {
    // 인증 컨텍스트로 별도 기록 생성 + 공유 링크 발급
    const authCtx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const authPage = await authCtx.newPage();
    const cookies = await authPage.context().cookies();
    const token = cookies.find((c) => c.name === 'x-guest-access-token')?.value ?? '';

    const record = await createTestRecord(authPage, 'E2E 공유 해제 테스트 기록');

    try {
      // 공유 링크 생성
      const shareRes = await authPage.request.post(`/api/posts/${record.id}/share`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {},
      });
      const shareBody = await shareRes.json();
      if (!shareBody.success) throw new Error(`공유 링크 생성 실패: ${JSON.stringify(shareBody.error)}`);
      const revokeToken = shareBody.data.shareToken;

      // 공유 해제 전 — 비인증 상태(page)로 접근 가능 확인
      await page.goto(`/share/${revokeToken}`);
      await expect(page.getByRole('heading', { name: 'E2E 공유 해제 테스트 기록' })).toBeVisible({ timeout: 15000 });

      // 공유 해제 (DELETE /api/posts/{id}/share)
      await authPage.request.delete(`/api/posts/${record.id}/share`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 공유 해제 후 — 같은 URL에 접근하면 에러 상태
      await page.goto(`/share/${revokeToken}`);
      await expect(page.getByText('공유된 기록을 찾을 수 없어요')).toBeVisible({ timeout: 15000 });
    } finally {
      await deleteTestRecord(authPage, record.id);
      await authCtx.close();
    }
  });
});
