import { test, expect } from '@playwright/test';

test.describe('온보딩', () => {
  test('스텝을 넘기면 문구가 바뀌고, 마지막 스텝에서 건너뛰기가 사라지며 시작하기 버튼으로 바뀐다', async ({
    page,
  }) => {
    await page.goto('/onboarding');

    await expect(
      page.getByRole('heading', { name: /사진 한 장만 올리세요/ }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '건너뛰기' })).toBeVisible();

    await page.getByRole('button', { name: '다음' }).click();
    await expect(
      page.getByRole('heading', { name: /취향대로 만드는/ }),
    ).toBeVisible();

    await page.getByRole('button', { name: '다음' }).click();
    await expect(
      page.getByRole('heading', { name: /따로 또 같이,/ }),
    ).toBeVisible();

    // 마지막 스텝: 건너뛰기 대신 시작하기만 남는다
    await expect(
      page.getByRole('button', { name: '건너뛰기' }),
    ).not.toBeVisible();
    await expect(page.getByRole('button', { name: '시작하기' })).toBeVisible();
  });

  test('점(dot)을 클릭하면 해당 스텝으로 바로 이동한다', async ({ page }) => {
    await page.goto('/onboarding');

    await page.getByRole('button', { name: '3번 페이지로 이동' }).click();
    await expect(
      page.getByRole('heading', { name: /따로 또 같이,/ }),
    ).toBeVisible();

    await page.getByRole('button', { name: '1번 페이지로 이동' }).click();
    await expect(
      page.getByRole('heading', { name: /사진 한 장만 올리세요/ }),
    ).toBeVisible();
  });

  test('건너뛰기를 누르면 callback 경로로 즉시 이동한다', async ({ page }) => {
    await page.goto('/onboarding?callback=%2Finquiry');

    await page.getByRole('button', { name: '건너뛰기' }).click();
    await expect(page).toHaveURL(/\/inquiry/, { timeout: 5000 });
  });

  test('마지막 스텝에서 시작하기를 누르면 callback 경로로 이동한다', async ({
    page,
  }) => {
    await page.goto('/onboarding?callback=%2Finquiry');

    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '시작하기' }).click();

    await expect(page).toHaveURL(/\/inquiry/, { timeout: 5000 });
  });

  test('callback이 없으면 완료 후 홈으로 이동한다', async ({ page }) => {
    await page.goto('/onboarding');

    await page.getByRole('button', { name: '건너뛰기' }).click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
