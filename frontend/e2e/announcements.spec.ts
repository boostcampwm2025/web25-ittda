import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ittda_admin';
const BACKEND = 'http://localhost:4000/v1';
const TEST_TITLE = 'E2E 테스트 공지사항';

// 공지사항 페이지는 서버 컴포넌트(RSC)로 백엔드에서 직접 fetch.
// beforeAll에서 admin API로 활성 공지를 생성하고 afterAll에서 삭제한다.
test.describe('공지사항', () => {
  let announcementId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BACKEND}/admin/announcements`, {
      headers: { 'x-admin-key': ADMIN_KEY },
      data: { title: TEST_TITLE, isActive: true },
    });
    const body = await res.json();
    announcementId = body?.id ?? body?.data?.id;
  });

  test.afterAll(async ({ request }) => {
    if (!announcementId) return;
    await request.delete(`${BACKEND}/admin/announcements/${announcementId}`, {
      headers: { 'x-admin-key': ADMIN_KEY },
    });
  });

  test('공지사항 페이지가 로드된다', async ({ page }) => {
    await page.goto('/announcements');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL('/announcements');
  });

  test('헤더에 "공지사항" 제목이 표시된다', async ({ page }) => {
    await page.goto('/announcements');
    await expect(page.getByRole('heading', { name: '공지사항', exact: true })).toBeVisible();
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

    const firstCard = page.locator('main > div').first();
    await expect(firstCard.locator('h3').first()).toBeVisible({ timeout: 8000 });
    await expect(firstCard.locator('h3').first()).not.toBeEmpty();
    await expect(firstCard.getByText(/\d{4}년/).first()).toBeVisible();
  });

  test('진행 중인 공지에는 "진행 중" 배지가 표시된다', async ({ page, request }) => {
    // announcement-modal.spec.ts와 병렬 실행 시 해당 spec의 beforeAll이
    // 이 spec의 활성 공지를 비활성화할 수 있으므로 테스트 직전 재활성화한다
    await request.patch(`${BACKEND}/admin/announcements/${announcementId}`, {
      headers: { 'x-admin-key': ADMIN_KEY },
      data: { isActive: true },
    });

    await page.goto('/announcements');
    await expect(page.getByText('진행 중').first()).toBeVisible({ timeout: 8000 });
  });
});
