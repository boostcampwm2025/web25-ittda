import { test, expect } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  createGuestSession,
  joinTestGroup,
} from './fixtures/api';

const GROUP_NAME = 'E2E 그룹 삭제 테스트';

/**
 * 그룹 삭제 시나리오
 *
 * 1. Non-admin은 그룹 삭제 UI에 접근할 수 없다 (popover에 그룹 정보 수정 버튼 없음)
 * 2. VIEWER는 /edit 페이지의 삭제 버튼이 비활성화된다
 * 3. Admin이 그룹을 삭제하면 본인의 /shared에서 그룹이 사라진다
 * 4. Admin이 그룹을 삭제하면 다른 멤버(B)의 /shared에서도 그룹이 사라진다
 *
 * 주의: 삭제 테스트는 afterAll 정리가 필요 없다 (그룹이 테스트 내에서 삭제됨).
 * 그러나 삭제가 실패하면 잔여 그룹이 남을 수 있으므로 각 describe에서 독립적인 그룹을 생성한다.
 */

test.describe('그룹 삭제 - Non-admin 접근 제한', () => {
  let groupId: string;
  let inviteCode: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const group = await createTestGroup(page, 'E2E 삭제 접근제한 테스트');
    groupId = group.id;
    inviteCode = group.inviteCode;
    await ctx.close();
  });

  // 이 describe의 그룹은 테스트 중 삭제되지 않으므로 afterAll에서 정리
  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await page.request.delete(`/api/groups/${groupId}`);
    await ctx.close();
  });

  test('EDITOR 멤버는 그룹 홈 Popover에서 그룹 정보 수정 버튼이 없어 삭제 페이지에 접근할 수 없다', async ({ browser }) => {
    const ctxB = await createGuestSession(browser);
    const pageB = await ctxB.newPage();
    try {
      await joinTestGroup(pageB, inviteCode);
      await pageB.goto(`/group/${groupId}`);
      await expect(pageB.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

      await pageB.getByRole('button', { name: '그룹 메뉴' }).click();

      // EDITOR는 그룹 정보 수정 메뉴가 없으므로 삭제 페이지 진입 불가
      await expect(pageB.getByRole('button', { name: '그룹 정보 수정' })).not.toBeVisible({ timeout: 3000 });
    } finally {
      await ctxB.close();
    }
  });
});

test.describe('그룹 삭제 - Admin이 삭제 후 /shared 비노출 확인', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  // B의 context는 시나리오 전체에서 살아있어야 한다
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    // Admin A(guest.json)가 그룹 생성
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, GROUP_NAME);
    groupId = group.id;
    inviteCode = group.inviteCode;

    // B가 그룹 참여
    ctxBRef = await createGuestSession(browser);
    const pageB = await ctxBRef.newPage();
    await joinTestGroup(pageB, inviteCode);
    await pageB.close();

    await ctxA.close();
  });

  test.afterAll(async () => {
    await ctxBRef?.close();
    ctxBRef = null;
  });

  test('Admin이 그룹 삭제 drawer를 열고 삭제하면 /shared 페이지로 리다이렉트된다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit`);

    // 삭제 drawer 오픈
    await page.getByRole('button', { name: '그룹 삭제하기' }).click();
    await expect(page.getByText(`정말 '${GROUP_NAME}' 그룹을 삭제하시겠습니까?`)).toBeVisible({ timeout: 5000 });

    // 삭제 확인
    await page.getByRole('dialog').getByRole('button', { name: '삭제하기' }).click();

    // 삭제 후 /shared로 이동
    await expect(page).toHaveURL(/\/shared/, { timeout: 10000 });
  });

  test('삭제된 그룹은 Admin A의 /shared에서 더 이상 표시되지 않는다', async ({ page }) => {
    await page.goto('/shared');
    // 그룹 이름이 포함된 카드가 없어야 한다
    await expect(page.getByRole('button', { name: GROUP_NAME })).not.toBeVisible({ timeout: 8000 });
  });

  test('삭제된 그룹은 멤버였던 B의 /shared에서도 표시되지 않는다', async () => {
    if (!ctxBRef) throw new Error('B context not initialized');
    const pageB = await ctxBRef.newPage();
    try {
      await pageB.goto('/shared');
      await expect(pageB.getByRole('button', { name: GROUP_NAME })).not.toBeVisible({ timeout: 8000 });
    } finally {
      await pageB.close();
    }
  });
});
