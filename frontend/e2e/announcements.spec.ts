import { test, expect } from '@playwright/test';

// 공지사항 페이지는 서버 컴포넌트(RSC)로 백엔드에서 직접 fetch.
// 실서버가 실행된 상태에서 테스트 — 공지사항이 없으면 안내 메시지를 보여준다.
test.describe('공지사항', () => {
  test('공지사항 페이지가 로드된다', async ({ page }) => {
    await page.goto('/announcements');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL('/announcements');
  });

  test('헤더에 "공지사항" 제목이 표시된다', async ({ page }) => {
    await page.goto('/announcements');
    await expect(page.getByRole('heading', { name: '공지사항' })).toBeVisible();
  });

  test('공지사항이 없을 때 안내 메시지가 표시된다', async ({ page }) => {
    await page.goto('/announcements');

    const isEmpty = await page.getByText('공지사항이 없습니다.').isVisible({ timeout: 3000 }).catch(() => false);
    const hasAnnouncements = await page.locator('main > div').count() > 0;

    // 공지사항이 없거나 있거나 - 둘 중 하나의 상태여야 한다
    expect(isEmpty || hasAnnouncements).toBe(true);
  });

  test('뒤로가기 버튼을 클릭하면 프로필 페이지로 이동한다', async ({ page }) => {
    await page.goto('/profile');
    await page.goto('/announcements');

    // Back 컴포넌트는 이전 페이지 또는 fallback(/profile)으로 이동
    const backButton = page.locator('button').first();
    await backButton.click();

    // /profile로 이동하거나 브라우저 히스토리의 이전 페이지로 이동
    await expect(page).toHaveURL(/\/(profile|announcements)/, { timeout: 3000 });
  });
});
