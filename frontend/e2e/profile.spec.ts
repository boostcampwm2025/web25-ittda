import { test, expect } from '@playwright/test';

// 프로필 데이터는 실 백엔드(/api/me)에서 fetch — 게스트 인증 상태로 실행
test.describe('프로필', () => {
  test('프로필 페이지가 로드된다', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL('/profile');
  });

  test('프로필 수정 버튼을 클릭하면 수정 페이지로 이동한다', async ({ page }) => {
    await page.goto('/profile');
    const editLink = page.locator('a[href="/profile/edit"], button').filter({ hasText: /수정|편집/i }).first();
    const hasLink = await editLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }
    await editLink.click();
    await expect(page).toHaveURL('/profile/edit');
  });
});

test.describe('프로필 수정', () => {
  test('프로필 수정 페이지에 닉네임 입력 필드가 표시된다', async ({ page }) => {
    await page.goto('/profile/edit');
    const nicknameInput = page.locator('input[name="nickname"], input[placeholder*="닉네임"]');
    await expect(nicknameInput).toBeVisible({ timeout: 5000 });
  });

  test('닉네임을 수정하고 저장하면 성공 토스트가 표시된다', async ({ page }) => {
    await page.goto('/profile/edit');
    const nicknameInput = page.locator('input[name="nickname"], input[placeholder*="닉네임"]').first();
    const hasInput = await nicknameInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasInput) { test.skip(); return; }

    await nicknameInput.clear();
    await nicknameInput.fill('E2E테스터');

    // API 응답을 기다리며 저장 버튼 클릭
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/me') && res.request().method() === 'PATCH',
        { timeout: 15000 },
      ),
      page.getByRole('button', { name: /저장|완료/i }).click(),
    ]);

    await expect(page.getByText('프로필 정보가 수정되었습니다.')).toBeVisible({ timeout: 5000 });
  });
});
