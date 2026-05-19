import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const TODAY = new Date();
const CURRENT_YEAR_MONTH = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}`;
const DISPLAY_YEAR_MONTH = `${TODAY.getFullYear()}.${String(TODAY.getMonth() + 1).padStart(2, '0')}`;

// 정렬 검증을 위해 서로 다른 날짜의 기록이 필요:
//   - 이번 달 1일: 기록 1개 (가장 오래된 날, 기록 적음)
//   - 오늘: 기록 3개 (가장 최신 날, 기록 많음)
// date-desc → 오늘 먼저, date-asc → 1일 먼저, count-desc → 오늘 먼저(기록 3개)
// → date-asc 와 count-desc 가 서로 다른 카드를 가리켜 정렬 로직을 독립적으로 검증
const FIRST_OF_MONTH = `${CURRENT_YEAR_MONTH}-01`;
const TODAY_STR = `${CURRENT_YEAR_MONTH}-${String(TODAY.getDate()).padStart(2, '0')}`;
const TODAY_DAY_BADGE = String(TODAY.getDate()).padStart(2, '0'); // date.split('-')[2] 형식

// 날짜 뱃지에서 첫 번째 카드의 일자(두 자리 문자열)를 읽는 헬퍼
const getFirstCardDay = (page: import('@playwright/test').Page) =>
  page.locator('.absolute.top-3.left-3.z-10').first().locator('span').first();

test.describe('주간 달력과 월별 기록함', () => {
  const postIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();

    // 이번 달 1일에 기록 1개 생성 (date-asc 에서 첫 번째)
    const firstRecord = await createTestRecord(page, 'E2E 1일 기록', FIRST_OF_MONTH);
    postIds.push(firstRecord.id);

    // 오늘 기록 3개 생성 (date-desc·count-desc 에서 첫 번째)
    for (let i = 1; i <= 3; i++) {
      const r = await createTestRecord(page, `E2E 오늘 기록 ${i}`, TODAY_STR);
      postIds.push(r.id);
    }

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    for (const id of postIds) {
      await deleteTestRecord(page, id);
    }
    await ctx.close();
  });

  test('주간 달력의 월을 클릭하면 해당 월의 기록함으로 이동한다', async ({ page }) => {
    await page.goto('/');

    // WeekCalendar 월 레이블 (예: "2026.05") 클릭
    const monthLabel = page.getByText(DISPLAY_YEAR_MONTH).first();
    await expect(monthLabel).toBeVisible({ timeout: 8000 });
    await monthLabel.click();

    await expect(page).toHaveURL(new RegExp(`/my/month/${CURRENT_YEAR_MONTH}`), { timeout: 10000 });
  });

  test('월별 기록함에서 정렬 아이콘을 클릭하면 정렬 drawer가 열리고 최신순·오래된순·기록 많은순을 선택할 수 있다', async ({
    page,
  }) => {
    await page.goto(`/my/month/${CURRENT_YEAR_MONTH}`);

    // 헤더 우측 정렬(ListFilter) 버튼 — Back 버튼 다음에 위치하므로 header 내 마지막 버튼
    const sortButton = page.locator('header').getByRole('button').last();
    await expect(sortButton).toBeVisible({ timeout: 8000 });
    await sortButton.click();

    // 정렬 drawer 표시 확인
    await expect(page.getByText('기록 정렬')).toBeVisible({ timeout: 5000 });

    // 세 가지 정렬 옵션 표시 확인
    await expect(page.getByText('최신순')).toBeVisible();
    await expect(page.getByText('오래된순')).toBeVisible();
    await expect(page.getByText('기록 많은순')).toBeVisible();

    // 옵션 선택 시 URL에 sort 쿼리 반영 — 오래된순 선택
    await page.getByRole('button', { name: '오래된순' }).click();
    await expect(page).toHaveURL(/sort=date-asc/, { timeout: 5000 });

    // drawer가 닫혔는지 확인
    await expect(page.getByText('기록 정렬')).not.toBeVisible();

    // 기록 많은순 선택으로 전환
    await sortButton.click();
    await expect(page.getByText('기록 정렬')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '기록 많은순' }).click();
    await expect(page).toHaveURL(/sort=count-desc/, { timeout: 5000 });
  });

  test('정렬 옵션에 따라 기록이 올바른 순서로 표시된다', async ({ page }) => {
    const waitForCards = () =>
      expect(getFirstCardDay(page)).toBeVisible({ timeout: 8000 });

    // 최신순(date-desc, 기본값): 오늘(기록 3개)이 첫 번째
    await page.goto(`/my/month/${CURRENT_YEAR_MONTH}`);
    await waitForCards();
    await expect(getFirstCardDay(page)).toHaveText(TODAY_DAY_BADGE);

    // 오래된순(date-asc): 1일(기록 1개)이 첫 번째 — date-desc 와 다른 카드
    await page.goto(`/my/month/${CURRENT_YEAR_MONTH}?sort=date-asc`);
    await waitForCards();
    await expect(getFirstCardDay(page)).toHaveText('01');

    // 기록 많은순(count-desc): 오늘(기록 3개)이 첫 번째 — date-asc 와 다른 카드
    await page.goto(`/my/month/${CURRENT_YEAR_MONTH}?sort=count-desc`);
    await waitForCards();
    await expect(getFirstCardDay(page)).toHaveText(TODAY_DAY_BADGE);
  });
});
