import { test, expect } from '@playwright/test';

test.describe('문의하기', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inquiry');
  });

  test('페이지 진입 시 문의 유형 선택지가 보인다', async ({ page }) => {
    await expect(page.getByRole('radio', { name: '버그 신고' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '기능 제안' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '계정/로그인 문제' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '기타' })).toBeVisible();
  });

  test('문의 유형을 선택하지 않으면 제출 버튼이 비활성화된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '제출' })).toBeDisabled();
  });

  test('문의 유형과 내용을 입력하면 제출 버튼이 활성화된다', async ({ page }) => {
    await page.getByRole('radio', { name: '버그 신고' }).check();
    await page.getByPlaceholder('내 답변').first().fill('버그 내용입니다.');
    await expect(page.getByRole('button', { name: '제출' })).toBeEnabled();
  });

  test('기타 선택 시 직접 입력 필드가 나타난다', async ({ page }) => {
    await page.getByRole('radio', { name: '기타' }).check();
    await expect(page.getByPlaceholder('직접 입력')).toBeVisible();
  });

  test('유효하지 않은 이메일 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('radio', { name: '버그 신고' }).check();
    await page.getByPlaceholder('내 답변').first().fill('내용');
    await page.locator('input[type="text"]').last().fill('invalid-email');
    await page.getByPlaceholder('내 답변').first().click();

    await expect(page.getByText('유효한 이메일 형식이 아닙니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '제출' })).toBeDisabled();
  });

  test('제출하면 onSuccess 후 문의 페이지를 벗어난다', async ({ page }) => {
    await page.getByRole('radio', { name: '버그 신고' }).check();
    await page.getByPlaceholder('내 답변').first().fill('E2E 자동화 테스트 문의입니다.');
    await page.getByRole('button', { name: '제출' }).click();

    // onSuccess → router.back() 으로 inquiry 페이지를 벗어남
    await expect(page).not.toHaveURL('/inquiry', { timeout: 10000 });
  });
});
