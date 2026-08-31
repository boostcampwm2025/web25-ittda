import { test, expect } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  deleteTestGroup,
  createGuestSession,
  joinTestGroup,
} from './fixtures/api';

/**
 * 그룹 알림(활동 피드) 페이지.
 * 그룹 생성(GROUP_CREATE)과 멤버 참여(MEMBER_JOIN)는 별도의 기록 생성 없이도
 * 실제 백엔드에서 활동 로그를 남기므로, 이 두 활동으로 피드 표시를 검증한다.
 */
test.describe('그룹 알림', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;

  test.beforeAll(async ({ browser }) => {
    const ctxA = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, 'E2E 알림 테스트 그룹');
    groupId = group.id;

    // B가 그룹에 참여 → MEMBER_JOIN 활동 발생
    const ctxB = await createGuestSession(browser);
    const pageB = await ctxB.newPage();
    await joinTestGroup(pageB, group.inviteCode);
    await pageB.close();
    await ctxB.close();

    await ctxA.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('그룹 생성과 멤버 참여 활동이 시간 정보와 함께 알림 목록에 표시된다', async ({
    page,
  }) => {
    await page.goto(`/group/${groupId}/notifications`);

    await expect(page.getByText(/그룹을 만들었습니다/)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/그룹에 참여했습니다/)).toBeVisible({
      timeout: 10000,
    });

    // 절대 시간이 "오전/오후 HH:mm" 형식으로 표시된다 (formatDateTime 기반)
    await expect(
      page.getByText(/(오전|오후) \d{2}:\d{2}/).first(),
    ).toBeVisible();
  });

  test('그룹 하단 네비게이션의 알림 탭으로 진입할 수 있다', async ({
    page,
  }) => {
    await page.goto(`/group/${groupId}`);
    await expect(page.getByRole('button', { name: '피드' })).toBeVisible({
      timeout: 8000,
    });

    // 알림 탭은 아이콘만 있어 접근성 라벨이 없으므로, 하단 네비게이션
    // 5개 버튼(피드/지도/작성/알림/보관함) 중 4번째(알림)를 클릭한다.
    const bottomNav = page.locator('.bottom-nav');
    await bottomNav.getByRole('button').nth(3).click();

    await expect(page).toHaveURL(
      new RegExp(`/group/${groupId}/notifications`),
      { timeout: 8000 },
    );
    await expect(page.getByText(/그룹을 만들었습니다/)).toBeVisible({
      timeout: 10000,
    });
  });
});
