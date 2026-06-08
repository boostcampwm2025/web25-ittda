import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestGroup, deleteTestGroup } from './fixtures/api';

test.describe('그룹 초대', () => {
  let groupId: string;
  let inviteCode: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const group = await createTestGroup(page);
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

  test('초대 코드로 접근하면 그룹 초대 UI와 그룹 정보(이름, 인원수)가 표시된다', async ({ page }) => {
    // 초대 페이지는 커버 이미지 로드로 'load' 이벤트가 느릴 수 있어 domcontentloaded 사용
    await page.goto(`/invite?inviteCode=${inviteCode}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('회원님을 그룹에 초대했습니다.')).toBeVisible({ timeout: 10000 });

    // 그룹 이름 표시 확인
    await expect(page.getByText('E2E 테스트 그룹')).toBeVisible({ timeout: 10000 });

    // 인원수 1명 표시 확인
    await expect(page.getByText(/1명/)).toBeVisible({ timeout: 5000 });
  });

  test('게스트로 인증된 사용자에게는 게스트 계정으로 참여하기 버튼이 표시된다', async ({ page }) => {
    await page.goto(`/invite?inviteCode=${inviteCode}`);
    // auth 스토어 hydration 완료 대기 — guest 상태면 "게스트 계정으로 참여하기"
    const joinButton = page.getByRole('button', { name: /게스트 계정으로 참여하기/i });
    await expect(joinButton).toBeVisible({ timeout: 5000 });
  });

  test('미인증 사용자에게는 로그인하고 참여하기 버튼이 표시된다', async ({ browser }) => {
    // 명시적 빈 storageState로 완전한 비인증 상태 보장
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonPage = await ctx.newPage();
    try {
      await anonPage.goto(`/invite?inviteCode=${inviteCode}`);
      await expect(anonPage.getByRole('button', { name: '로그인하고 참여하기' })).toBeVisible({ timeout: 8000 });
    } finally {
      await ctx.close();
    }
  });

  test('미인증 사용자가 로그인하고 참여하기 버튼을 클릭하면 로그인 페이지로 이동한다', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonPage = await ctx.newPage();
    try {
      await anonPage.goto(`/invite?inviteCode=${inviteCode}`, { waitUntil: 'domcontentloaded' });
      // API 응답 및 React hydration 완료 대기 (이 텍스트는 useQuery 응답 후에만 렌더링됨)
      await expect(anonPage.getByText('회원님을 그룹에 초대했습니다.')).toBeVisible({ timeout: 10000 });
      await expect(anonPage.getByRole('button', { name: '로그인하고 참여하기' })).toBeVisible({ timeout: 8000 });
      await anonPage.getByRole('button', { name: '로그인하고 참여하기' }).click();
      await expect(anonPage).toHaveURL(/\/login/, { timeout: 15000 });
    } finally {
      await ctx.close();
    }
  });

  test('초대 코드 없이 접근하면 유효하지 않은 초대 링크 메시지가 표시된다', async ({ page }) => {
    await page.goto('/invite');
    await expect(page.getByText('유효하지 않은 초대 링크')).toBeVisible({ timeout: 8000 });
  });
});
