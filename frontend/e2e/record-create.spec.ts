import { test, expect } from '@playwright/test';
import { RecordEditorPage } from './pages/RecordEditorPage';

const TODAY = new Date().toISOString().split('T')[0];

test.describe('기록 작성', () => {
  test('기록 작성 페이지에 진입하면 에디터가 표시된다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'add', date: TODAY });

    await expect(page.locator('header').getByRole('heading', { name: '기록 작성' })).toBeVisible();
  });

  test('제목을 입력하면 저장 버튼이 활성화된다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'add', date: TODAY });

    await editor.fillTitle('오늘의 기록');
    await expect(editor.saveButton).toBeEnabled();
  });

  test('제목과 내용을 입력하고 저장하면 기록 상세 페이지로 이동한다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'add', date: TODAY });

    await editor.fillTitle('E2E 저장 테스트');
    await page.getByPlaceholder('어떤 기억이 있으신가요?').fill('자동화 테스트 내용입니다.');

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/posts') && res.request().method() === 'POST',
        { timeout: 30000 },
      ),
      editor.save(),
    ]);

    await expect(page).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 10000 });
  });

  test('뒤로가기 버튼을 클릭하면 이전 페이지로 이동한다', async ({ page }) => {
    await page.goto('/my');
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'add', date: TODAY });

    await page.goBack();
    await expect(page).toHaveURL(/\/my/);
  });
});
