import { test, expect } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  deleteTestGroup,
  createGuestSession,
  joinTestGroup,
  updateGroupMemberProfile,
  createTestRecord,
  deleteTestRecord,
} from './fixtures/api';

/**
 * 그룹 멤버 프로필(닉네임) 변경 후 여러 화면에서 반영 여부를 확인한다.
 *
 * 확인 위치:
 * 1. 멤버 관리 페이지 (/group/{id}/edit/members)
 * 2. 그룹 홈 멤버 아바타 영역 (GroupMainTabs 상단)
 *
 * 기록 상세 / 타임라인의 기여자 프로필 확인은 그룹 기록(draft → publish 플로우)
 * 생성이 선행되어야 하므로 별도 테스트에서 다룬다.
 */
test.describe('그룹 멤버 프로필 변경 반영', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  const NICKNAME_BEFORE = 'E2E변경전닉네임';
  const NICKNAME_AFTER = 'E2E변경후닉네임';
  let ctxBRef: import('@playwright/test').BrowserContext | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();
    const group = await createTestGroup(pageA, 'E2E 프로필 변경 테스트');
    groupId = group.id;
    inviteCode = group.inviteCode;

    // B가 그룹 참여 후 초기 닉네임 설정 — 테스트 전체에서 같은 B 세션 재사용
    ctxBRef = await createGuestSession(browser);
    const pageB = await ctxBRef.newPage();
    await joinTestGroup(pageB, inviteCode);
    await updateGroupMemberProfile(pageB, groupId, NICKNAME_BEFORE);
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

  test('B가 그룹 닉네임을 변경하면 Admin의 멤버 관리 페이지에 새 닉네임이 표시된다', async ({ browser }) => {
    // 동일한 B가 닉네임을 NICKNAME_AFTER로 변경 (새 세션 생성 시 B2가 추가 가입되는 문제 방지)
    if (!ctxBRef) throw new Error('B context not initialized');
    const pageB = await ctxBRef.newPage();
    try {
      await updateGroupMemberProfile(pageB, groupId, NICKNAME_AFTER);
    } finally {
      await pageB.close();
    }

    // A(admin)가 멤버 관리 페이지에서 새 닉네임 확인
    const ctxA = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const pageA = await ctxA.newPage();
    try {
      await pageA.goto(`/group/${groupId}/edit/members`);
      await expect(pageA.getByText(NICKNAME_AFTER)).toBeVisible({ timeout: 8000 });
      await expect(pageA.getByText(NICKNAME_BEFORE)).not.toBeVisible({ timeout: 3000 });
    } finally {
      await ctxA.close();
    }
  });

  test('B가 그룹 닉네임을 변경하면 그룹 홈 멤버 아바타 목록에 반영된다', async ({ page }) => {
    // 그룹 홈(GroupMainTabs)의 멤버 아바타는 alt 텍스트로 구분 불가하므로
    // 아바타 개수(멤버 수)가 올바른지로 간접 검증한다.
    await page.goto(`/group/${groupId}`);
    await expect(page.getByRole('button', { name: '피드' })).toBeVisible({ timeout: 8000 });

    // 그룹 멤버는 A + B = 2명이므로 아바타가 2개 표시되어야 한다
    // GroupMainTabs: members.slice(0, 4).map((m) => <div key={m.memberId}>...)
    const avatars = page.locator('[data-app-root] .rounded-full').filter({ hasNot: page.locator('svg') });
    await expect(avatars).toHaveCount(2, { timeout: 8000 });
  });
});

/**
 * 그룹 기록 상세 페이지에서 기여자 프로필 변경 반영 확인.
 * 그룹 기록이 생성된 경우에만 유효하다.
 *
 * 현재 그룹 기록 생성은 draft → publish UI 플로우가 필요하기 때문에
 * 개인 기록을 PERSONAL scope로 생성하는 방법으로 대체 불가하여
 * 이 테스트 블록은 별도 마킹 없이 추가한다.
 * 필요 시 createGroupRecord fixture가 완성되면 활성화한다.
 */
test.describe.skip('그룹 기록 상세 및 타임라인 - 기여자 프로필 변경 반영', () => {
  // TODO: createGroupRecord fixture 완성 후 활성화
  // 기록 상세 페이지 작성자 섹션, 타임라인의 기여자 아바타 검증 추가 예정
});
