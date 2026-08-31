import { test, expect } from '@playwright/test';
import path from 'path';

// 백엔드 .env.local의 ADMIN_KEY (개발 환경 기본값)
const ADMIN_KEY = process.env.E2E_ADMIN_KEY ?? 'ittda_admin';
const ANNOUNCEMENT_TITLE = 'E2E 테스트 공지사항';

// /api/admin/announcements → Next.js 프록시 → 백엔드 /v1/admin/announcements
async function createAnnouncement(
  request: import('@playwright/test').APIRequestContext,
): Promise<string> {
  const res = await request.post('/api/admin/announcements', {
    headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
    data: {
      title: ANNOUNCEMENT_TITLE,
      content: 'E2E 테스트 중 생성된 공지입니다.',
      isActive: true,
    },
  });
  const body = await res.json();
  if (!body.data?.id) throw new Error(`공지 생성 실패: ${JSON.stringify(body)}`);
  return body.data.id;
}

async function deleteAnnouncement(
  request: import('@playwright/test').APIRequestContext,
  id: string,
): Promise<void> {
  await request.delete(`/api/admin/announcements/${id}`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
}

test.describe('홈 공지사항 팝업', () => {
  let announcementId: string;

  test.use({ storageState: path.join(__dirname, '.auth/guest.json') });

  test.beforeAll(async ({ request }) => {
    // isActive: true 생성 시 기존 활성 공지가 자동 비활성화됨
    announcementId = await createAnnouncement(request);
  });

  test.afterAll(async ({ request }) => {
    await deleteAnnouncement(request, announcementId);
  });

  test('활성 공지사항이 있으면 홈 진입 시 팝업 모달이 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText(ANNOUNCEMENT_TITLE),
    ).toBeVisible({ timeout: 8000 });
    // 확인 버튼도 함께 표시된다
    await expect(page.getByRole('button', { name: '확인' })).toBeVisible();
  });

  test('"확인" 버튼을 누르면 모달이 닫히고 다시 홈에 와도 팝업이 뜨지 않는다', async ({ page }) => {
    // 각 테스트는 test.use({ storageState })로 독립된 컨텍스트를 가지므로
    // dismiss 쿠키가 없는 초기 상태로 시작됨
    await page.goto('/');
    await expect(page.getByText(ANNOUNCEMENT_TITLE)).toBeVisible({ timeout: 8000 });

    // 2) 확인 버튼 클릭 → dismiss 쿠키 설정 + router.refresh()
    await page.getByRole('button', { name: '확인' }).click();
    await expect(page.getByText(ANNOUNCEMENT_TITLE)).not.toBeVisible({ timeout: 5000 });

    // 3) 홈 재진입 → 쿠키 기반으로 SSR에서 모달 렌더링 제외
    await page.goto('/');
    await expect(page.getByText(ANNOUNCEMENT_TITLE)).not.toBeVisible({ timeout: 5000 });
  });
});
