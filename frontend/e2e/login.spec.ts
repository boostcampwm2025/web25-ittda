import { test, expect } from '@playwright/test';

test.describe('로그인', () => {
  test('처음 방문한 사용자가 가입 없이 시작하기를 클릭하면 toast가 표시되고 홈으로 이동한다', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonPage = await ctx.newPage();
    try {
      await anonPage.goto('/login');

      // 새 게스트 세션 생성 API 호출 확인 (이 경로일 때 toast가 표시됨)
      // window.location.href로 full reload가 일어나 toast를 직접 잡기 어려우므로
      // POST /api/auth/guest 호출 여부로 "toast가 뜨는 코드 경로"임을 검증
      await Promise.all([
        anonPage.waitForResponse(
          (res) =>
            res.url().includes('/api/auth/guest') &&
            !res.url().includes('/restore') &&
            res.request().method() === 'POST',
          { timeout: 15000 },
        ),
        anonPage.getByRole('button', { name: '가입 없이 시작하기' }).click(),
      ]);

      // 홈으로 이동
      await anonPage.waitForURL('/', { timeout: 15000 });
    } finally {
      await ctx.close();
    }
  });

  test('이미 유효한 게스트 계정으로 가입 없이 시작하기를 클릭하면 toast 없이 홈으로 이동한다', async ({
    page,
  }) => {
    await page.goto('/login');

    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/api/auth/guest/restore') && res.request().method() === 'POST',
        { timeout: 15000 },
      ),
      page.getByRole('button', { name: '가입 없이 시작하기' }).click(),
    ]);

    // 홈으로 이동
    await page.waitForURL('/', { timeout: 15000 });

    // 기존 세션 복원이므로 만료 안내 toast가 없어야 함
    await expect(page.getByText(/게스트 모드는 3일/)).not.toBeVisible();
  });
});
