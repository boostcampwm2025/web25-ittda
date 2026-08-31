import { test, expect } from '@playwright/test';
import { RecordEditorPage } from './pages/RecordEditorPage';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

test.describe('기록 수정', () => {
  let postId: string;

  test.beforeEach(async ({ page }) => {
    const record = await createTestRecord(page, '수정 테스트용 기록');
    postId = record.id;
  });

  test.afterEach(async ({ page }) => {
    if (postId) await deleteTestRecord(page, postId);
  });

  test('수정 모드 진입 시 헤더에 "기록 수정"이 표시된다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'edit', postId });

    await expect(page.locator('header').getByRole('heading', { name: '기록 수정' })).toBeVisible();
  });

  test('기존 제목이 에디터에 채워져 있다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'edit', postId });

    await expect(editor.titleInput).toHaveValue('수정 테스트용 기록', { timeout: 5000 });
  });

  test('제목을 변경하고 저장하면 기록 상세 페이지로 이동한다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'edit', postId });

    await editor.titleInput.clear();
    await editor.fillTitle('수정된 제목');

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes(`/api/posts/${postId}`) && res.request().method() === 'PATCH',
        { timeout: 15000 },
      ),
      editor.save(),
    ]);

    await expect(page).toHaveURL(new RegExp(`/record/${postId}`), { timeout: 10000 });
  });
});
