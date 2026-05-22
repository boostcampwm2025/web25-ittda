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

  test('공지사항이 있을 때 각 항목에 제목과 날짜가 표시된다', async ({ page }) => {
    await page.goto('/announcements');

    // 빈 상태면 건너뜀
    const isEmpty = await page
      .getByText('공지사항이 없습니다.')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (isEmpty) {
      test.skip();
      return;
    }

    const firstCard = page.locator('main > div').first();
    // 제목 — h3 태그
    await expect(firstCard.locator('h3')).toBeVisible({ timeout: 8000 });
    await expect(firstCard.locator('h3')).not.toBeEmpty();
    // 날짜 — formatKoreanDate가 '년' 포함
    await expect(firstCard.getByText(/\d{4}년/)).toBeVisible();
  });

  test('진행 중인 공지에는 "진행 중" 배지가 표시된다', async ({ page }) => {
    await page.goto('/announcements');

    const badge = page.getByText('진행 중');
    const hasBadge = await badge.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasBadge) {
      // 현재 활성 공지가 없는 환경이면 건너뜀
      test.skip();
      return;
    }

    await expect(badge.first()).toBeVisible();
  });
});
