import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestGroup, deleteTestGroup } from './fixtures/api';

const GROUP_NAME = 'E2E 그룹 생성 테스트';

test.describe('/shared 그룹 목록', () => {
  let groupId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const group = await createTestGroup(page, GROUP_NAME);
    groupId = group.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestGroup(page, groupId);
    await ctx.close();
  });

  test('그룹을 추가하면 /shared 페이지에서 해당 그룹 이름의 카드를 확인할 수 있으며 인원은 1명이다', async ({ page }) => {
    await page.goto('/shared');

    // 그룹 이름이 포함된 카드(div[role="button"]) 확인
    // SharedRecords → GroupCard → RecordCard → PostCard → div[role="button"]
    // PostCard.Title: <h3>{group.name}</h3>
    const groupCard = page.getByRole('button').filter({ hasText: GROUP_NAME }).first();
    await expect(groupCard).toBeVisible({ timeout: 8000 });

    // 인원 표시 확인 — PostCard.Badge: "${memberCount}명 • ${recordCount}기록"
    // 생성 직후 멤버는 생성자 1명
    await expect(groupCard.getByText(/1명/)).toBeVisible();
  });
});
