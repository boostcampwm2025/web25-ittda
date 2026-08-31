import { test, expect } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  deleteTestGroup,
  createGuestSession,
  joinTestGroup,
  getGroupSettings,
  changeMemberRole,
  withdrawTestUser,
} from './fixtures/api';

/**
 * 회원 탈퇴 시나리오
 *
 * 1. 탈퇴 UI: /profile 페이지에서 탈퇴하기 버튼 → drawer 확인 → /login 이동
 *
 * 2. 탈퇴 + Admin 남아있는 그룹 → 그룹 유지
 *    - 탈퇴자(A, fresh)가 속한 그룹에 다른 Admin(B, guest.json)이 있으면
 *      A만 탈퇴 처리되고 그룹은 계속 존재한다
 *    - B의 /shared에서 그룹이 여전히 보인다
 *
 * 3. 탈퇴 + 승격 가능한 멤버(VIEWER 아님)가 있음 → 자동 승격
 *    - 탈퇴자(A, fresh)만 Admin인 그룹에 EDITOR인 B(fresh)가 있으면
 *      B가 자동으로 Admin으로 승격되고 그룹은 유지된다
 *
 * 4. 탈퇴 + 승격 가능한 멤버 없음(VIEWER만 남음) → 그룹 삭제
 *    - 탈퇴자(A, fresh)만 Admin인 그룹에 VIEWER인 B(fresh)만 남아있으면
 *      그룹이 삭제된다
 *
 * 주의: 탈퇴 테스트는 모두 fresh guest session을 사용한다.
 *       guest.json 계정은 절대 탈퇴하지 않는다.
 */

// ── 시나리오 1: 탈퇴 UI 흐름 ─────────────────────────────────────────────────
// 주의: '탈퇴하기' 버튼은 소셜 로그인 사용자에게만 표시됨.
//       게스트 세션에서는 탈퇴 UI 대신 API 기반으로 탈퇴 흐름을 검증한다.

test.describe('회원 탈퇴 - UI 흐름', () => {
  let ctxARef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    ctxARef = await createGuestSession(browser);
  });

  test.afterAll(async () => {
    await ctxARef?.close();
    ctxARef = null;
  });

  test('게스트 사용자의 /profile 페이지에는 탈퇴하기 버튼 대신 로그인 버튼이 표시된다', async () => {
    if (!ctxARef) throw new Error('A context not initialized');
    const pageA = await ctxARef.newPage();
    try {
      await pageA.goto('/profile');
      await expect(pageA.getByRole('button', { name: '로그인' })).toBeVisible({ timeout: 8000 });
      await expect(pageA.getByRole('button', { name: '탈퇴하기' })).not.toBeVisible({ timeout: 3000 });
    } finally {
      await pageA.close();
    }
  });

  test('탈퇴 API 호출 후 보호된 페이지 접근 시 /login으로 리다이렉트된다', async () => {
    if (!ctxARef) throw new Error('A context not initialized');
    const pageA = await ctxARef.newPage();
    try {
      await withdrawTestUser(pageA);
      await pageA.goto('/profile');
      await expect(pageA).toHaveURL(/\/login/, { timeout: 10000 });
    } finally {
      await pageA.close();
    }
  });
});

// ── 시나리오 2: 탈퇴 + Admin 남아있는 그룹 → 그룹 유지 ──────────────────────

test.describe('회원 탈퇴 - 다른 Admin이 있으면 그룹 유지', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const GROUP_NAME = 'E2E 탈퇴 그룹유지 테스트';

  test.beforeAll(async ({ browser }) => {
    // A(fresh): 탈퇴할 사용자, 그룹 생성자 → Admin
    const ctxA = await createGuestSession(browser);
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, GROUP_NAME);
    groupId = group.id;
    inviteCode = group.inviteCode;

    // B(guest.json): 그룹 참여 후 ADMIN으로 승격 → 그룹 유지 담당
    const ctxB = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageB = await ctxB.newPage();
    await joinTestGroup(pageB, inviteCode);

    // A가 B를 ADMIN으로 승격
    const settings = await getGroupSettings(pageA, groupId);
    const memberB = settings.members.find((m) => m.role === 'EDITOR');
    if (memberB) {
      await changeMemberRole(pageA, groupId, memberB.userId, 'ADMIN');
    }

    // A가 탈퇴 (API 직접 호출로 테스트 속도 개선)
    await withdrawTestUser(pageA);

    await ctxA.close();
    await ctxB.close();
  });

  test.afterAll(async ({ browser }) => {
    // B(guest.json)가 남아있으므로 그룹 정리
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('A 탈퇴 후에도 다른 Admin B의 /shared에는 그룹이 남아있다', async ({ page }) => {
    await page.goto('/shared');
    await expect(page.getByRole('button', { name: GROUP_NAME })).toBeVisible({ timeout: 8000 });
  });

  test('A 탈퇴 후 B의 멤버 관리 페이지에는 B만 남아있다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit/members`);
    await expect(page.getByText(/멤버 관리 \(1\)/)).toBeVisible({ timeout: 8000 });
  });
});

// ── 시나리오 3: 탈퇴 + 승격 가능한 멤버(VIEWER 아님)가 있음 → 자동 승격 ──────
// handleWithdrawalMembership: 마지막 Admin 탈퇴 시 남은 멤버 중 VIEWER가
// 아닌 멤버가 있으면 그 멤버가 자동으로 Admin으로 승격되고 그룹은 유지된다.

test.describe('회원 탈퇴 - 마지막 Admin 탈퇴 시 승격 가능한 멤버가 있으면 자동 승격', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const GROUP_NAME = 'E2E 탈퇴 자동승격 테스트';
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;
  let memberBUserId: string;

  test.beforeAll(async ({ browser }) => {
    // A(fresh): 그룹 생성 및 탈퇴할 유일한 Admin
    const ctxA = await createGuestSession(browser);
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, GROUP_NAME);
    groupId = group.id;
    inviteCode = group.inviteCode;

    // B(fresh): EDITOR로 그룹 참여 (Admin으로 승격 없음 — 자동 승격 대상)
    ctxBRef = await createGuestSession(browser);
    const pageB = await ctxBRef.newPage();
    await joinTestGroup(pageB, inviteCode);

    const settingsBeforeWithdraw = await getGroupSettings(pageA, groupId);
    const memberB = settingsBeforeWithdraw.members.find((m) => m.role === 'EDITOR');
    if (!memberB) throw new Error('B 멤버를 찾을 수 없습니다.');
    memberBUserId = memberB.userId;
    await pageB.close();

    // A가 탈퇴 (유일한 Admin) → 서버에서 B를 Admin으로 자동 승격
    await withdrawTestUser(pageA);
    await ctxA.close();
  });

  test.afterAll(async () => {
    if (!ctxBRef) return;
    const page = await ctxBRef.newPage();
    await deleteTestGroup(page, groupId);
    await page.close();
    await ctxBRef.close();
    ctxBRef = null;
  });

  test('유일한 Admin A 탈퇴 후에도 그룹이 유지되고 B가 새 Admin으로 승격된다', async () => {
    if (!ctxBRef) throw new Error('B context not initialized');
    const page = await ctxBRef.newPage();
    try {
      await page.goto('/shared');
      await expect(page.getByRole('button', { name: GROUP_NAME })).toBeVisible({ timeout: 8000 });

      const settingsAfterWithdraw = await getGroupSettings(page, groupId);
      const promotedMember = settingsAfterWithdraw.members.find(
        (m) => m.userId === memberBUserId,
      );
      expect(promotedMember?.role).toBe('ADMIN');
    } finally {
      await page.close();
    }
  });
});

// ── 시나리오 4: 탈퇴 + 승격 가능한 멤버 없음(VIEWER만 남음) → 그룹 삭제 ─────
test.describe('회원 탈퇴 - 마지막 Admin 탈퇴 시 승격 가능한 멤버가 없으면 그룹 삭제', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const GROUP_NAME = 'E2E 탈퇴 그룹삭제 테스트';
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    // A(fresh): 그룹 생성 및 탈퇴할 유일한 Admin
    const ctxA = await createGuestSession(browser);
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, GROUP_NAME);
    groupId = group.id;
    inviteCode = group.inviteCode;

    // B(fresh): 그룹 참여 후 VIEWER로 강등 (승격 후보가 없도록)
    ctxBRef = await createGuestSession(browser);
    const pageB = await ctxBRef.newPage();
    await joinTestGroup(pageB, inviteCode);

    const settings = await getGroupSettings(pageA, groupId);
    const memberB = settings.members.find((m) => m.role === 'EDITOR');
    if (!memberB) throw new Error('B 멤버를 찾을 수 없습니다.');
    await changeMemberRole(pageA, groupId, memberB.userId, 'VIEWER');
    await pageB.close();

    // A가 탈퇴 (유일한 Admin) → 승격 후보가 없어 서버에서 그룹 자동 삭제
    await withdrawTestUser(pageA);
    await ctxA.close();
  });

  test.afterAll(async () => {
    await ctxBRef?.close();
    ctxBRef = null;
    // 그룹은 탈퇴 시 삭제되므로 별도 cleanup 불필요
  });

  test('유일한 Admin A 탈퇴 후 멤버였던 B의 /shared에서 그룹이 사라진다', async () => {
    if (!ctxBRef) throw new Error('B context not initialized');
    const pageB = await ctxBRef.newPage();
    try {
      await pageB.goto('/shared');
      await expect(pageB.getByRole('button', { name: GROUP_NAME })).not.toBeVisible({ timeout: 8000 });
    } finally {
      await pageB.close();
    }
  });

  test('유일한 Admin A 탈퇴 후 그룹 페이지에 직접 접근하면 그룹이 없음을 확인할 수 있다', async () => {
    if (!ctxBRef) throw new Error('B context not initialized');
    const pageB = await ctxBRef.newPage();
    try {
      await pageB.goto(`/group/${groupId}`);
      // 존재하지 않는 그룹 접근 시 앱 루트 not-found 페이지가 인라인 렌더링된다
      // (URL은 유지되고 "존재하지 않는 그룹입니다" 토스트도 함께 뜨지만,
      // 토스트는 자동으로 사라지므로 안정적인 페이지 헤딩으로 검증한다)
      await expect(
        pageB.getByRole('heading', { name: '기억의 연결이 끊겼어요' }),
      ).toBeVisible({ timeout: 8000 });
    } finally {
      await pageB.close();
    }
  });
});
