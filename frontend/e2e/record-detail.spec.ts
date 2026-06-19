import { test, expect } from '@playwright/test';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

test.describe('기록 상세 조회', () => {
  let postId: string;

  test.beforeEach(async ({ page }) => {
    const record = await createTestRecord(page, '상세 조회 테스트 기록');
    postId = record.id;
  });

  test.afterEach(async ({ page }) => {
    if (postId) await deleteTestRecord(page, postId);
  });

  test('기록 상세 페이지에 제목이 표시된다', async ({ page }) => {
    await page.goto(`/record/${postId}`);
    await expect(page.getByRole('heading', { name: '상세 조회 테스트 기록' })).toBeVisible({ timeout: 8000 });
  });

  test('텍스트 블록 내용이 표시된다', async ({ page }) => {
    await page.goto(`/record/${postId}`);
    await expect(page.locator('p', { hasText: 'E2E 테스트 내용입니다.' })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('기록 상세 에러 처리', () => {
  test('존재하지 않는 기록은 "기록을 찾을 수 없습니다" 메시지를 표시한다', async ({ page }) => {
    await page.goto('/record/00000000-0000-0000-0000-000000000000');
    await expect(page.getByRole('heading', { name: '기록을 찾을 수 없습니다' })).toBeVisible({ timeout: 8000 });
  });
});
