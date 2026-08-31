import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const TODAY = new Date();
const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;
const FIRST_OF_MONTH = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-01`;

const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);
const YESTERDAY_STR = `${YESTERDAY.getFullYear()}-${String(YESTERDAY.getMonth() + 1).padStart(2, '0')}-${String(YESTERDAY.getDate()).padStart(2, '0')}`;

const RECORD_TITLE = 'E2E 필터 검색 기록';   // 모든 필터 조건 포함
const CONTROL_TITLE = 'E2E 필터 대조 기록';  // 태그·감정·위치 없음 (오늘)
const YESTERDAY_TITLE = 'E2E 날짜 대조 기록'; // 어제 날짜 (날짜 필터 제외용)

const TAG = 'E2E필터태그';
const MOOD = '행복';
const PLACE_NAME = '서울시청';
const LAT = 37.5665;
const LNG = 126.978;

// POST /api/search 응답을 기다리는 헬퍼
const waitForSearch = (page: import('@playwright/test').Page) =>
  page.waitForResponse(
    (res) => res.url().includes('/api/search') && res.request().method() === 'POST',
    { timeout: 10000 },
  );

// 검색 페이지로 이동하고 Fast Refresh(dev 컴파일) 완료까지 대기
async function gotoSearch(page: import('@playwright/test').Page) {
  await page.goto('/search');
  // Fast Refresh가 진행 중이면 네트워크 요청이 끝날 때까지 대기
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
}

test.describe('검색 필터', () => {
  const postIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();

    // MAIN: 태그+감정+위치 모두 포함, 오늘
    const main = await createTestRecord(page, RECORD_TITLE, TODAY_STR, {
      extraBlocks: [
        { type: 'TAG', value: { tags: [TAG] }, layout: { row: 3, col: 1, span: 2 } },
        { type: 'MOOD', value: { mood: MOOD }, layout: { row: 4, col: 1, span: 2 } },
        {
          type: 'LOCATION',
          value: { lat: LAT, lng: LNG, address: '서울특별시 중구 세종대로 110', placeName: PLACE_NAME },
          layout: { row: 5, col: 1, span: 2 },
        },
      ],
    });
    postIds.push(main.id);

    // CONTROL: 태그·감정·위치 없음, 오늘 (필터 제외 검증용)
    const control = await createTestRecord(page, CONTROL_TITLE, TODAY_STR);
    postIds.push(control.id);

    // YESTERDAY: 어제 날짜 (날짜 필터 제외 검증용, 오늘이 1일이면 같은 날짜가 되지만 허용)
    const yesterday = await createTestRecord(page, YESTERDAY_TITLE, YESTERDAY_STR);
    postIds.push(yesterday.id);

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

  test('태그로 검색하면 해당 태그를 가진 기록만 찾을 수 있다', async ({ page }) => {
    await gotoSearch(page);

    const tagChip = page.getByRole('button', { name: '태그' });
    await expect(tagChip).toBeVisible({ timeout: 10000 });
    await tagChip.click();

    const tagInput = page.getByPlaceholder('태그를 입력하세요');
    await expect(tagInput).toBeVisible({ timeout: 5000 });
    await tagInput.fill(TAG);
    await page.keyboard.press('Enter');

    await Promise.all([
      page.waitForURL(/tags=/, { timeout: 8000 }),
      page.getByText('완료').click(),
    ]);

    // MAIN: 해당 태그 포함 → 결과에 포함
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL: 태그 없음 → 결과에서 제외
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
  });

  test('감정으로 검색하면 해당 감정을 가진 기록만 찾을 수 있다', async ({ page }) => {
    await gotoSearch(page);

    const emotionChip = page.getByRole('button', { name: '감정' });
    await expect(emotionChip).toBeVisible({ timeout: 10000 });
    await emotionChip.click();

    await expect(page.locator('[role="dialog"]').getByText(MOOD)).toBeVisible({ timeout: 5000 });
    await page.locator('[role="dialog"]').getByText(MOOD).click();

    await page.getByText('확인').click();
    await expect(page).toHaveURL(/emotions=/, { timeout: 8000 });

    // MAIN: 해당 감정 포함 → 결과에 포함
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL: 감정 없음 → 결과에서 제외
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
  });

  test('날짜로 오늘을 선택하면 오늘 추가한 기록을 확인할 수 있다', async ({ page }) => {
    await gotoSearch(page);

    const dateChip = page.getByRole('button', { name: '날짜' });
    await expect(dateChip).toBeVisible({ timeout: 10000 });
    await dateChip.click();

    // 오늘 날짜 한 번 클릭 → start=today, end=null (단일 날짜 검색)
    await expect(page.getByText('이 달 전체 선택')).toBeVisible({ timeout: 5000 });
    const todayBtn = page.getByRole('button', { name: String(TODAY.getDate()), exact: true }).first();
    await todayBtn.click();

    await page.getByText('완료').click();
    await expect(page).toHaveURL(new RegExp(`start=${TODAY_STR}`), { timeout: 8000 });

    // MAIN·CONTROL: 오늘 날짜 → 결과에 포함
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
    // YESTERDAY: 어제 날짜 → 결과에서 제외 (오늘이 1일이면 같은 달이지만 날짜 다름)
    if (TODAY.getDate() > 1) {
      await expect(page.getByText(YESTERDAY_TITLE)).not.toBeVisible();
    }
  });

  test('이달 전체 선택 시 미래 날짜 없이 이달 기록을 확인할 수 있다', async ({ page }) => {
    await gotoSearch(page);

    const dateChip = page.getByRole('button', { name: '날짜' });
    await expect(dateChip).toBeVisible({ timeout: 10000 });
    await dateChip.click();

    await expect(page.getByText('이 달 전체 선택')).toBeVisible({ timeout: 5000 });
    await page.getByText('이 달 전체 선택').click();

    await page.getByText('완료').click();

    // start = 이달 1일, end = 오늘 (미래 날짜 미포함 검증)
    await expect(page).toHaveURL(new RegExp(`start=${FIRST_OF_MONTH}`), { timeout: 8000 });
    await expect(page).toHaveURL(new RegExp(`end=${TODAY_STR}`));

    // MAIN·CONTROL: 오늘(이달) → 포함
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(CONTROL_TITLE).first()).toBeVisible({ timeout: 5000 });
  });

  test('위치로 검색하면 해당 장소를 가진 기록만 찾을 수 있다', async ({ page }) => {
    // 위치 필터는 지도 페이지로 이동하므로 URL 직접 조작
    await page.goto(
      `/search?lat=${LAT}&lng=${LNG}&address=${encodeURIComponent(PLACE_NAME)}&radius=10`,
    );

    // MAIN: 해당 위치 포함 → 결과에 포함
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL: 위치 없음 → 결과에서 제외
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
  });

  test('태그·감정·날짜·위치를 모두 적용해 종합 검색하면 조건을 모두 만족하는 기록만 찾을 수 있다', async ({
    page,
  }) => {
    await page.goto(
      `/search?tags=${encodeURIComponent(TAG)}` +
      `&emotions=${encodeURIComponent(MOOD)}` +
      `&start=${TODAY_STR}` +
      `&lat=${LAT}&lng=${LNG}&address=${encodeURIComponent(PLACE_NAME)}&radius=10`,
    );

    // MAIN: 모든 조건 만족 → 포함
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL·YESTERDAY: 조건 미충족 → 제외
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
    await expect(page.getByText(YESTERDAY_TITLE)).not.toBeVisible();
  });

  test('input으로 제목 검색 시 제목이 일치하는 기록을 확인할 수 있다', async ({ page }) => {
    await gotoSearch(page);

    const input = page.getByPlaceholder('제목이나 내용으로 검색');
    await expect(input).toBeVisible({ timeout: 5000 });

    await Promise.all([waitForSearch(page), input.fill('E2E 필터 검색')]);

    // MAIN: '필터 검색' 제목 일치 → 포함
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 8000 });
    // CONTROL·YESTERDAY: 제목 불일치 → 제외
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
    await expect(page.getByText(YESTERDAY_TITLE)).not.toBeVisible();
  });
});
