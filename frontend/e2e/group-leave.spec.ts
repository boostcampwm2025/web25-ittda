import { test, expect } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  deleteTestGroup,
  createGuestSession,
  joinTestGroup,
  updateGroupMemberProfile,
  getGroupSettings,
  changeMemberRole,
} from './fixtures/api';

/**
 * 그룹 나가기 시나리오
 *
 * 1. EDITOR(B)가 나가면
 *    - B의 /shared에서 그룹이 사라진다
 *    - Admin(A)의 멤버 관리에서 B가 사라진다
 *
 * 2. 마지막 Admin(A)이 나가면 → 그룹이 자동 삭제된다
 *    - 나간 A도, 다른 멤버였던 B도 그룹에 접근할 수 없다
 *
 * 3. Admin(C)이 나가도 다른 Admin(A)이 남아있으면 → C만 나가고 그룹은 유지된다
 *    - C의 /shared에서 그룹이 사라진다
 *    - A의 멤버 관리에서 C가 사라지고 그룹은 여전히 존재한다
 */

// ── 시나리오 1: EDITOR 멤버 나가기 ──────────────────────────────────────────

test.describe('그룹 나가기 - EDITOR 멤버 나가기', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const MEMBER_B_NICKNAME = 'E2E나가기멤버';
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, 'E2E EDITOR 나가기 테스트');
    groupId = group.id;
    inviteCode = group.inviteCode;

    ctxBRef = await createGuestSession(browser);
    const pageB = await ctxBRef.newPage();
    await joinTestGroup(pageB, inviteCode);
    await updateGroupMemberProfile(pageB, groupId, MEMBER_B_NICKNAME);
    await pageB.close();

    await ctxA.close();
  });

  test.afterAll(async ({ browser }) => {
    await ctxBRef?.close();
    ctxBRef = null;
    // B가 나간 후 그룹은 A(guest.json)가 소유 → 정리
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('B가 그룹 나가기를 실행하면 B의 /shared에서 그룹이 사라진다', async () => {
    if (!ctxBRef) throw new Error('B context not initialized');
    const pageB = await ctxBRef.newPage();
    try {
      // 나가기 버튼 클릭 → drawer 확인 → 나가기
      await pageB.goto(`/group/${groupId}`);
      await expect(pageB.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

      await pageB.getByRole('button', { name: '그룹 메뉴' }).click();
      await pageB.getByRole('button', { name: '그룹 나가기' }).click();

      // 확인 drawer
      await expect(pageB.getByRole('dialog').getByRole('button', { name: '그룹 나가기' })).toBeVisible({ timeout: 5000 });
      await pageB.getByRole('dialog').getByRole('button', { name: '그룹 나가기' }).click();

      // /shared로 리다이렉트
      await expect(pageB).toHaveURL(/\/shared/, { timeout: 10000 });

      // B의 /shared에서 그룹 카드 비노출
      await expect(pageB.getByRole('button', { name: 'E2E EDITOR 나가기 테스트' })).not.toBeVisible({ timeout: 8000 });
    } finally {
      await pageB.close();
    }
  });

  test('B가 나가면 Admin A의 멤버 관리 페이지에서 B가 목록에 표시되지 않는다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit/members`);
    await expect(page.getByText(MEMBER_B_NICKNAME)).not.toBeVisible({ timeout: 8000 });
  });
});

// ── 시나리오 2: 마지막 Admin이 나가면 그룹 삭제 ──────────────────────────────
// TODO: 백엔드에서 다른 멤버가 있을 때 마지막 Admin의 나가기 허용 + 그룹 자동 삭제 구현 후 활성화

test.describe.skip('그룹 나가기 - 마지막 Admin 나가기 → 그룹 자동 삭제', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  let ctxARef: import('@playwright/test').BrowserContext | null = null;
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    // 마지막 Admin: 새 게스트 A (guest.json 보호를 위해 fresh session 사용)
    ctxARef = await createGuestSession(browser);
    const pageA = await ctxARef.newPage();
    const group = await createTestGroup(pageA, 'E2E 마지막Admin 나가기');
    groupId = group.id;
    inviteCode = group.inviteCode;

    // B도 참여 (EDITOR)
    ctxBRef = await createGuestSession(browser);
    const pageB = await ctxBRef.newPage();
    await joinTestGroup(pageB, inviteCode);
    await pageB.close();
    await pageA.close();
  });

  test.afterAll(async () => {
    await ctxARef?.close();
    ctxARef = null;
    await ctxBRef?.close();
    ctxBRef = null;
    // 그룹은 나가기로 삭제되므로 별도 cleanup 불필요
  });

  test('마지막 Admin이 나가면 /shared로 이동하고 그룹이 사라진다', async () => {
    if (!ctxARef) throw new Error('A context not initialized');
    const pageA = await ctxARef.newPage();
    try {
      await pageA.goto(`/group/${groupId}`);
      await expect(pageA.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

      await pageA.getByRole('button', { name: '그룹 메뉴' }).click();
      await pageA.getByRole('button', { name: '그룹 나가기' }).click();

      // 확인 drawer에서 나가기
      await pageA.getByRole('dialog').getByRole('button', { name: '그룹 나가기' }).click();

      // /shared 이동
      await expect(pageA).toHaveURL(/\/shared/, { timeout: 10000 });
      await expect(pageA.getByRole('button', { name: 'E2E 마지막Admin 나가기' })).not.toBeVisible({ timeout: 8000 });
    } finally {
      await pageA.close();
    }
  });

  test('그룹 삭제 후 다른 멤버였던 B도 해당 그룹에 접근할 수 없다', async () => {
    if (!ctxBRef) throw new Error('B context not initialized');
    const pageB = await ctxBRef.newPage();
    try {
      await pageB.goto('/shared');
      await expect(pageB.getByRole('button', { name: 'E2E 마지막Admin 나가기' })).not.toBeVisible({ timeout: 8000 });

      // 그룹 페이지 직접 접근 시 그룹 없음 처리 (리다이렉트 또는 404)
      await pageB.goto(`/group/${groupId}`);
      // 그룹이 없으므로 /shared 또는 에러 페이지로 이동
      await expect(pageB).not.toHaveURL(new RegExp(`/group/${groupId}$`), { timeout: 8000 });
    } finally {
      await pageB.close();
    }
  });
});

// ── 시나리오 3: Admin 나가기 (다른 Admin 존재) → 해당 멤버만 나가기 ──────────

test.describe('그룹 나가기 - Admin 나가기 (다른 Admin 존재) → 그룹 유지', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  let ctxCRef: import('@playwright/test').BrowserContext | null = null;
  const GROUP_NAME = 'E2E Admin나가기 그룹유지';

  test.beforeAll(async ({ browser }) => {
    // Admin A: guest.json (남을 사람)
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, GROUP_NAME);
    groupId = group.id;
    inviteCode = group.inviteCode;

    // C: 새 게스트 (나갈 사람, ADMIN으로 승격)
    ctxCRef = await createGuestSession(browser);
    const pageC = await ctxCRef.newPage();
    await joinTestGroup(pageC, inviteCode);

    // A가 C를 ADMIN으로 승격
    const settings = await getGroupSettings(pageA, groupId);
    const memberC = settings.members.find((m) => {
      // C는 A(guest.json)가 아닌 멤버
      return m.role === 'EDITOR';
    });
    if (memberC) {
      await changeMemberRole(pageA, groupId, memberC.userId, 'ADMIN');
    }

    await pageC.close();
    await ctxA.close();
  });

  test.afterAll(async ({ browser }) => {
    await ctxCRef?.close();
    ctxCRef = null;
    // A(guest.json)가 남아있으므로 그룹 정리
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('Admin C가 나가면 C의 /shared에서 그룹이 사라지지만 그룹은 삭제되지 않는다', async () => {
    if (!ctxCRef) throw new Error('C context not initialized');
    const pageC = await ctxCRef.newPage();
    try {
      await pageC.goto(`/group/${groupId}`);
      await expect(pageC.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

      await pageC.getByRole('button', { name: '그룹 메뉴' }).click();
      await pageC.getByRole('button', { name: '그룹 나가기' }).click();
      await pageC.getByRole('dialog').getByRole('button', { name: '그룹 나가기' }).click();

      await expect(pageC).toHaveURL(/\/shared/, { timeout: 10000 });
      await expect(pageC.getByRole('button', { name: GROUP_NAME })).not.toBeVisible({ timeout: 8000 });
    } finally {
      await pageC.close();
    }
  });

  test('C가 나간 후에도 Admin A의 /shared에는 그룹이 남아있다', async ({ page }) => {
    await page.goto('/shared');
    await expect(page.getByRole('button', { name: GROUP_NAME })).toBeVisible({ timeout: 8000 });
  });

  test('C가 나간 후 Admin A의 멤버 관리에서 C가 목록에 없고 그룹에는 A만 남는다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit/members`);

    // 멤버 수 label: "멤버 관리 (N)"
    await expect(page.getByText(/멤버 관리 \(1\)/)).toBeVisible({ timeout: 8000 });
  });
});
