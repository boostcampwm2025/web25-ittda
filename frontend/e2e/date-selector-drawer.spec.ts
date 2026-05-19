import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_YEAR_MONTH = `${CURRENT_YEAR}-${String(TODAY.getMonth() + 1).padStart(2, '0')}`;
const TODAY_STR = `${CURRENT_YEAR_MONTH}-${String(TODAY.getDate()).padStart(2, '0')}`;
const TODAY_DAY = TODAY.getDate();

const PREV_MONTH = new Date(CURRENT_YEAR, TODAY.getMonth() - 1, 1);
const PREV_YEAR_MONTH = `${PREV_MONTH.getFullYear()}-${String(PREV_MONTH.getMonth() + 1).padStart(2, '0')}`;

const RECORD_TITLE = 'E2E 날짜 찾기 테스트 기록';

async function openDateDrawer(page: Page) {
  await page.goto('/my');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  // "내 기록함" heading과 같은 flex-between 행에 있는 달력 버튼
  const calendarBtn = page
    .locator('.flex.items-center.justify-between')
    .filter({ has: page.getByRole('heading', { name: '내 기록함' }) })
    .getByRole('button');
  await expect(calendarBtn).toBeVisible({ timeout: 8000 });
  await calendarBtn.click();
  await expect(page.getByText('날짜로 찾기')).toBeVisible({ timeout: 5000 });
}

test.describe('내 기록함 날짜 찾기 drawer', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const record = await createTestRecord(page, RECORD_TITLE, TODAY_STR);
    postId = record.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!postId) return;
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('날짜를 선택하면 해당 날짜의 기록을 타임라인으로 확인할 수 있다', async ({ page }) => {
    await openDateDrawer(page);

    // 달력에서 오늘 날짜 버튼 클릭 — drawer 내 dialog 영역으로 스코프
    // "전월"/"후월" 레이블 span과 구분하기 위해 exact: true 사용
    await Promise.all([
      page.waitForURL(new RegExp(`/my/detail/${TODAY_STR}`), { timeout: 10000 }),
      page
        .locator('[role="dialog"]')
        .getByRole('button', { name: String(TODAY_DAY), exact: true })
        .click(),
    ]);

    // 오늘 생성한 기록 타이틀 확인 (타임라인에서 같은 타이틀이 여러 요소로 렌더링될 수 있어 first() 사용)
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 8000 });
  });

  test('전월로 이동 후 월 기록 전체보기를 클릭하면 해당 월의 기록함으로 이동한다', async ({
    page,
  }) => {
    await openDateDrawer(page);

    // 전월 버튼: "전월" span의 직접 부모 div 안의 버튼
    // div.filter({has: span}) 은 모든 조상 div에 매칭되므로 xpath=.. 으로 span의 부모만 타겟
    await page
      .locator('span')
      .filter({ hasText: /^전월$/ })
      .locator('xpath=..')
      .getByRole('button')
      .click();

    // 헤더 월 레이블이 전월로 변경됐는지 확인
    await expect(
      page.getByText(`${PREV_MONTH.getFullYear()}년 ${PREV_MONTH.getMonth() + 1}월`),
    ).toBeVisible({ timeout: 3000 });

    // 월 기록 전체보기 클릭
    await Promise.all([
      page.waitForURL(new RegExp(`/my/month/${PREV_YEAR_MONTH}`), { timeout: 10000 }),
      page.getByText('월 기록 전체보기').click(),
    ]);
  });

  test('년도 기록 전체보기를 클릭하면 해당 년도의 기록함으로 이동한다', async ({ page }) => {
    await openDateDrawer(page);

    await Promise.all([
      page.waitForURL(new RegExp(`/my/year/${CURRENT_YEAR}`), { timeout: 10000 }),
      page.getByText(`${CURRENT_YEAR}년 기록 전체보기`).click(),
    ]);
  });
});
