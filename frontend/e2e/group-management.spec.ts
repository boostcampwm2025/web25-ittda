import { test, expect } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  deleteTestGroup,
  createGuestSession,
  joinTestGroup,
  updateGroupMemberProfile,
} from './fixtures/api';

// ── 그룹 홈 탭 및 popover 메뉴 ───────────────────────────────────────────────

test.describe('그룹 홈 탭 및 popover 메뉴', () => {
  let groupId: string;
  let inviteCode: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const group = await createTestGroup(page, 'E2E 그룹 탭 테스트');
    groupId = group.id;
    inviteCode = group.inviteCode;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('그룹 홈에서 피드/보관함 탭을 전환할 수 있다', async ({ page }) => {
    await page.goto(`/group/${groupId}`);
    await expect(page.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

    // 보관함 탭 전환 (router.replace는 history.replaceState라 waitForURL 대신 waitForFunction으로 URL 직접 polling)
    await page.getByRole('button', { name: '보관함' }).click();
    await page.waitForFunction(() => window.location.search.includes('tab=archive'), { timeout: 8000 });

    // 피드 탭 복귀
    await page.getByRole('button', { name: '피드' }).click();
    await page.waitForFunction(() => !window.location.search.includes('tab=archive'), { timeout: 8000 });
  });

  test('Admin은 Popover에서 그룹 정보 수정, 멤버 관리, 나의 그룹 프로필, 그룹 나가기 버튼이 모두 표시된다', async ({ page }) => {
    await page.goto(`/group/${groupId}`);
    await expect(page.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: '그룹 메뉴' }).click();

    await expect(page.getByRole('button', { name: '그룹 정보 수정' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '멤버 관리' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '나의 그룹 프로필' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '그룹 나가기' })).toBeVisible({ timeout: 5000 });
  });

  test('EDITOR 멤버는 Popover에서 그룹 정보 수정, 멤버 관리 버튼이 표시되지 않는다', async ({ browser }) => {
    const ctxB = await createGuestSession(browser);
    const pageB = await ctxB.newPage();
    try {
      await joinTestGroup(pageB, inviteCode);
      await pageB.goto(`/group/${groupId}`);
      await expect(pageB.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

      await pageB.getByRole('button', { name: '그룹 메뉴' }).click();

      await expect(pageB.getByRole('button', { name: '그룹 정보 수정' })).not.toBeVisible({ timeout: 3000 });
      await expect(pageB.getByRole('button', { name: '멤버 관리' })).not.toBeVisible({ timeout: 3000 });
      // 모든 멤버에게 표시되는 항목
      await expect(pageB.getByRole('button', { name: '나의 그룹 프로필' })).toBeVisible({ timeout: 3000 });
      await expect(pageB.getByRole('button', { name: '그룹 나가기' })).toBeVisible({ timeout: 3000 });
    } finally {
      await ctxB.close();
    }
  });

  test('그룹 정보 수정 버튼 클릭 시 /edit 페이지로 이동한다', async ({ page }) => {
    await page.goto(`/group/${groupId}`);
    await expect(page.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: '그룹 메뉴' }).click();
    await page.getByRole('button', { name: '그룹 정보 수정' }).click();

    await expect(page).toHaveURL(new RegExp(`/group/${groupId}/edit`), { timeout: 5000 });
  });

  test('멤버 관리 버튼 클릭 시 /edit/members 페이지로 이동한다', async ({ page }) => {
    await page.goto(`/group/${groupId}`);
    await expect(page.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: '그룹 메뉴' }).click();
    await page.getByRole('button', { name: '멤버 관리' }).click();

    await expect(page).toHaveURL(new RegExp(`/group/${groupId}/edit/members`), { timeout: 5000 });
  });
});

// ── 그룹 이름 수정 ───────────────────────────────────────────────────────────

test.describe('그룹 정보 수정 페이지 - 그룹 이름 변경', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const ORIGINAL_NAME = 'E2E 이름수정 전';
  const UPDATED_NAME = 'E2E 이름수정 후';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const group = await createTestGroup(page, ORIGINAL_NAME);
    groupId = group.id;
    inviteCode = group.inviteCode;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('Admin이 그룹 이름을 수정하면 저장 후 변경된 이름이 표시된다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit`);

    await page.getByRole('button', { name: /편집/ }).click();

    const nameInput = page.getByPlaceholder('그룹명을 작성해주세요.');
    await expect(nameInput).toBeEnabled({ timeout: 5000 });
    await nameInput.clear();
    await nameInput.fill(UPDATED_NAME);

    await page.getByRole('button', { name: /저장/ }).click();
    await expect(page.getByText('그룹 이름이 변경되었습니다.')).toBeVisible({ timeout: 5000 });
    await expect(nameInput).toHaveValue(UPDATED_NAME, { timeout: 5000 });
  });

  test('Admin이 그룹 이름을 변경하면 다른 멤버가 그룹 홈에 접속할 때 변경된 이름이 표시된다', async ({ browser }) => {
    const ctxB = await createGuestSession(browser);
    const pageB = await ctxB.newPage();
    try {
      await joinTestGroup(pageB, inviteCode);
      // 그룹 홈 헤더의 그룹 이름 확인 (GroupHeaderActions의 span)
      await pageB.goto(`/group/${groupId}`);
      await expect(pageB.locator('span').filter({ hasText: UPDATED_NAME }).first()).toBeVisible({ timeout: 8000 });
      // /shared 카드에서도 확인
      await pageB.goto('/shared');
      await expect(pageB.getByRole('button', { name: UPDATED_NAME })).toBeVisible({ timeout: 8000 });
    } finally {
      await ctxB.close();
    }
  });
});

// ── 멤버 역할 변경 ───────────────────────────────────────────────────────────

test.describe('멤버 관리 - 역할 변경', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const MEMBER_B_NICKNAME = 'E2E역할변경멤버';
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, 'E2E 역할 변경 테스트');
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
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('Admin이 EDITOR 멤버의 역할을 뷰어로 변경할 수 있다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit/members`);
    await expect(page.getByText(MEMBER_B_NICKNAME)).toBeVisible({ timeout: 8000 });

    const bCard = page.locator('[data-testid="member-card"]').filter({ has: page.getByText(MEMBER_B_NICKNAME) });
    await bCard.getByRole('button', { name: '편집자' }).click();

    await expect(page.getByText(`${MEMBER_B_NICKNAME}님의 권한 변경`)).toBeVisible({ timeout: 5000 });

    // 뷰어 역할 선택
    await page.getByRole('button', { name: '뷰어' }).first().click();
    await page.getByRole('button', { name: '닫기' }).click();

    // '닫기'는 역할 변경 API를 트리거함 → API 완료 후 낙관적 업데이트 대기
    const bCardOptimistic = page.locator('[data-testid="member-card"]').filter({ has: page.getByText(MEMBER_B_NICKNAME) });
    await expect(bCardOptimistic.locator('span').filter({ hasText: '뷰어' })).toBeVisible({ timeout: 8000 });

    // 서버 반영 확인을 위해 reload 후 재검증
    await page.reload();
    await expect(page.getByText(MEMBER_B_NICKNAME)).toBeVisible({ timeout: 8000 });
    const bCardAfter = page.locator('[data-testid="member-card"]').filter({ has: page.getByText(MEMBER_B_NICKNAME) });
    await expect(bCardAfter.locator('span').filter({ hasText: '뷰어' })).toBeVisible({ timeout: 5000 });
  });

  test('VIEWER로 변경된 멤버는 그룹 홈에서 초대 버튼이 표시되지 않는다', async () => {
    // VIEWER는 GroupHeaderActions에서 초대 버튼(GroupInviteDrawer)이 숨겨진다
    if (!ctxBRef) throw new Error('B context not initialized');
    const pageB = await ctxBRef.newPage();
    try {
      await pageB.goto(`/group/${groupId}`);
      await expect(pageB.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });
      // 초대 버튼이 없어야 함
      await expect(pageB.getByRole('button', { name: '멤버 초대' })).not.toBeVisible({ timeout: 5000 });
    } finally {
      await pageB.close();
    }
  });
});

// ── 멤버 내보내기 ────────────────────────────────────────────────────────────

test.describe('멤버 관리 - 멤버 내보내기', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const MEMBER_B_NICKNAME = 'E2E내보내기멤버';
  const GROUP_NAME = 'E2E 내보내기 테스트';
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, GROUP_NAME);
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
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('Admin이 멤버를 내보내면 멤버 목록에서 해당 멤버가 사라진다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit/members`);
    await expect(page.getByText(MEMBER_B_NICKNAME)).toBeVisible({ timeout: 8000 });

    // B의 내보내기 버튼 클릭 (aria-label로 식별)
    await page.getByRole('button', { name: `${MEMBER_B_NICKNAME} 내보내기` }).click();

    // 확인 drawer
    await expect(page.getByText(`정말 '${MEMBER_B_NICKNAME}'님을 그룹에서 내보내시겠습니까?`)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '내보내기' }).click();

    // B가 목록에서 사라짐 (drawer 제목과 멤버 카드 모두 있을 수 있으므로 member-card 기준으로 확인)
    await expect(page.locator('[data-testid="member-card"]').filter({ has: page.getByText(MEMBER_B_NICKNAME, { exact: true }) })).not.toBeVisible({ timeout: 8000 });
  });

  test('내보내진 멤버는 /shared에서 해당 그룹을 볼 수 없다', async () => {
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

// ── 그룹 삭제 버튼 접근 ──────────────────────────────────────────────────────

test.describe('그룹 정보 수정 페이지 - 그룹 삭제 버튼 접근', () => {
  let groupId: string;
  let inviteCode: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const group = await createTestGroup(page, 'E2E 삭제버튼 접근 테스트');
    groupId = group.id;
    inviteCode = group.inviteCode;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('Admin은 그룹 삭제하기 버튼이 활성화 상태로 표시된다', async ({ page }) => {
    await page.goto(`/group/${groupId}/edit`);

    const deleteBtn = page.getByRole('button', { name: '그룹 삭제하기' });
    await expect(deleteBtn).toBeVisible({ timeout: 8000 });
    await expect(deleteBtn).not.toBeDisabled();
  });

  test('EDITOR 멤버는 /edit 접근 시 /edit/profile로 리다이렉트된다', async ({ browser }) => {
    const ctxB = await createGuestSession(browser);
    const pageB = await ctxB.newPage();
    try {
      await joinTestGroup(pageB, inviteCode);
      await pageB.goto(`/group/${groupId}/edit`);

      // 서버 컴포넌트에서 ADMIN이 아닌 경우 /edit/profile로 리다이렉트함
      await expect(pageB).toHaveURL(new RegExp(`/group/${groupId}/edit/profile`), { timeout: 8000 });
    } finally {
      await ctxB.close();
    }
  });

  test('VIEWER 멤버는 /edit 접근 시 /edit/profile로 리다이렉트된다', async ({ browser }) => {
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();

    const inviteRes = await pageA.request.post(`/api/groups/${groupId}/invites`, {
      data: { permission: 'VIEWER', expiresInSeconds: 86400 },
    });
    const inviteBody = await inviteRes.json();
    const viewerCode = inviteBody.data?.code;
    await ctxA.close();

    const ctxB = await createGuestSession(browser);
    const pageB = await ctxB.newPage();
    try {
      if (viewerCode) {
        await joinTestGroup(pageB, viewerCode);
        await pageB.goto(`/group/${groupId}/edit`);

        // 서버 컴포넌트에서 ADMIN이 아닌 경우 /edit/profile로 리다이렉트함
        await expect(pageB).toHaveURL(new RegExp(`/group/${groupId}/edit/profile`), { timeout: 8000 });
      }
    } finally {
      await ctxB.close();
    }
  });
});
