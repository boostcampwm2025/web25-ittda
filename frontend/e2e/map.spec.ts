import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

// 기본 지도 중심 좌표(경복궁) — DEFAULT_BOUNDS_DELTA(0.1) 범위 내에 위치해 초기 API 요청에서 조회됨
const MAP_LAT = 37.5796;
const MAP_LNG = 126.977;
const RECORD_TITLE = 'E2E 지도 테스트 기록';

// 필터 검증용 상수
const FILTER_TAG = 'E2EMapFilter태그';
const FILTER_EMOTION = '행복';
const MAIN_TITLE = 'E2E 지도 필터 기록 (태그+감정)';   // 필터 조건 포함
const CONTROL_TITLE = 'E2E 지도 대조 기록 (위치만)';   // 필터 조건 없음
const YESTERDAY_TITLE = 'E2E 지도 어제 기록';           // 어제 날짜 (날짜 필터 대조용)

const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);
const YESTERDAY_STR = YESTERDAY.toISOString().split('T')[0];
const TWO_DAYS_AGO = new Date(TODAY);
TWO_DAYS_AGO.setDate(TODAY.getDate() - 2);
const TWO_DAYS_AGO_STR = TWO_DAYS_AGO.toISOString().split('T')[0];

const LOCATION_BLOCK = {
  type: 'LOCATION',
  value: {
    lat: MAP_LAT,
    lng: MAP_LNG,
    address: '서울특별시 종로구 사직로 161',
    placeName: '경복궁',
  },
  layout: { row: 3, col: 1, span: 2 },
};

async function gotoMap(page: import('@playwright/test').Page) {
  await page.goto('/map');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
}

test.describe('지도', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const page = await ctx.newPage();
    const record = await createTestRecord(page, RECORD_TITLE, undefined, {
      extraBlocks: [
        {
          type: 'LOCATION',
          value: {
            lat: MAP_LAT,
            lng: MAP_LNG,
            address: '서울특별시 종로구 사직로 161',
            placeName: '경복궁',
          },
          layout: { row: 3, col: 1, span: 2 },
        },
      ],
    });
    postId = record.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('지도 페이지가 로드된다', async ({ page }) => {
    await page.goto('/map');
    await expect(page).toHaveURL('/map');
    await expect(page.locator('body')).toBeVisible();
  });

  test('장소 검색 바와 필터 칩이 표시된다', async ({ page }) => {
    await gotoMap(page);
    await expect(page.getByPlaceholder('장소를 검색하세요')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: '태그' })).toBeVisible();
    await expect(page.getByRole('button', { name: '감정' })).toBeVisible();
    await expect(page.getByRole('button', { name: '날짜' })).toBeVisible();
  });

  test('하단 드로어에 주변 기록 목록이 표시된다', async ({ page }) => {
    await gotoMap(page);
    await expect(page.getByText(RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/주변 기록 \d+개/)).toBeVisible({ timeout: 8000 });
  });

  test('기록 아이템의 → 버튼을 클릭하면 기록 상세 페이지로 이동한다', async ({ page }) => {
    await gotoMap(page);
    const recordItem = page.locator(`[data-post-id="${postId}"]`);
    await expect(recordItem).toBeVisible({ timeout: 10000 });

    // MapRecordItem의 navigate 버튼(ChevronRight, stopPropagation 처리된 버튼)
    const navigateBtn = recordItem.getByRole('button');
    await navigateBtn.click();

    await expect(page).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 8000 });
  });

  test('태그 필터 칩을 클릭하면 태그 검색 드로어가 열린다', async ({ page }) => {
    await gotoMap(page);
    await page.getByRole('button', { name: '태그' }).click();
    await expect(page.getByText('여러 태그로 검색')).toBeVisible({ timeout: 5000 });
  });

  test('감정 필터 칩을 클릭하면 감정 선택 드로어가 열린다', async ({ page }) => {
    await gotoMap(page);
    await page.getByRole('button', { name: '감정' }).click();
    await expect(page.getByText('감정으로 검색')).toBeVisible({ timeout: 5000 });
  });

  test('날짜 필터 칩을 클릭하면 날짜 기간 선택 드로어가 열린다', async ({ page }) => {
    await gotoMap(page);
    await page.getByRole('button', { name: '날짜' }).click();
    await expect(page.getByText('기간 선택')).toBeVisible({ timeout: 5000 });
  });

  test('URL에 태그 필터가 있으면 칩이 활성화 상태로 표시된다', async ({ page }) => {
    await page.goto('/map?tags=E2E태그');
    await expect(page.getByRole('button', { name: /E2E태그/ })).toBeVisible({ timeout: 8000 });
  });

  test('URL에 감정 필터가 있으면 칩이 활성화 상태로 표시된다', async ({ page }) => {
    await page.goto('/map?emotions=행복');
    await expect(page.getByRole('button', { name: /행복/ })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('지도 필터', () => {
  let mainId: string;
  let controlId: string;
  let yesterdayId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const page = await ctx.newPage();

    // MAIN: 태그 + 감정 + 위치, 오늘 날짜 (태그·감정·날짜 필터 조건 충족)
    const main = await createTestRecord(page, MAIN_TITLE, TODAY_STR, {
      extraBlocks: [
        LOCATION_BLOCK,
        { type: 'TAG', value: { tags: [FILTER_TAG] }, layout: { row: 4, col: 1, span: 2 } },
        { type: 'MOOD', value: { mood: FILTER_EMOTION }, layout: { row: 5, col: 1, span: 2 } },
      ],
    });
    mainId = main.id;

    // CONTROL: 위치만 포함, 오늘 날짜 (태그·감정 필터 조건 없음)
    const control = await createTestRecord(page, CONTROL_TITLE, TODAY_STR, {
      extraBlocks: [LOCATION_BLOCK],
    });
    controlId = control.id;

    // YESTERDAY: 위치 포함, 어제 날짜 (날짜 필터 대조용)
    const yesterday = await createTestRecord(page, YESTERDAY_TITLE, YESTERDAY_STR, {
      extraBlocks: [LOCATION_BLOCK],
    });
    yesterdayId = yesterday.id;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const page = await ctx.newPage();
    await deleteTestRecord(page, mainId);
    await deleteTestRecord(page, controlId);
    await deleteTestRecord(page, yesterdayId);
    await ctx.close();
  });

  test('필터 미적용 시 조건 기록과 대조 기록이 모두 드로어에 표시된다', async ({ page }) => {
    await gotoMap(page);
    await expect(page.getByText(MAIN_TITLE).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(CONTROL_TITLE).first()).toBeVisible({ timeout: 8000 });
  });

  test('태그 필터 적용 시 해당 태그를 가진 기록만 표시된다', async ({ page }) => {
    await page.goto(`/map?tags=${encodeURIComponent(FILTER_TAG)}`);

    // MAIN: 해당 태그 포함 → 드로어에 표시
    await expect(page.getByText(MAIN_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL: 태그 없음 → 드로어에 표시되지 않음
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
  });

  test('감정 필터 적용 시 해당 감정을 가진 기록만 표시된다', async ({ page }) => {
    await page.goto(`/map?emotions=${encodeURIComponent(FILTER_EMOTION)}`);

    // MAIN: 해당 감정 포함 → 드로어에 표시
    await expect(page.getByText(MAIN_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL: 감정 없음 → 드로어에 표시되지 않음
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
  });

  test('태그+감정 복합 필터 적용 시 두 조건을 모두 만족하는 기록만 표시된다', async ({ page }) => {
    await page.goto(
      `/map?tags=${encodeURIComponent(FILTER_TAG)}&emotions=${encodeURIComponent(FILTER_EMOTION)}`,
    );

    // MAIN: 두 조건 모두 충족 → 표시
    await expect(page.getByText(MAIN_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL: 두 조건 모두 미충족 → 표시되지 않음
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
  });

  test('오늘 날짜 필터 적용 시 오늘 기록만 표시된다', async ({ page }) => {
    await page.goto(`/map?start=${TODAY_STR}&end=${TODAY_STR}`);

    // MAIN·CONTROL: 오늘 날짜 → 표시
    await expect(page.getByText(MAIN_TITLE).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(CONTROL_TITLE).first()).toBeVisible({ timeout: 8000 });
    // YESTERDAY: 어제 날짜 → 표시되지 않음
    if (TODAY.getDate() > 1) {
      await expect(page.getByText(YESTERDAY_TITLE)).not.toBeVisible();
    }
  });

  test('어제 날짜 필터 적용 시 어제 기록만 표시된다', async ({ page }) => {
    await page.goto(`/map?start=${YESTERDAY_STR}&end=${YESTERDAY_STR}`);

    // YESTERDAY: 어제 날짜 → 표시
    await expect(page.getByText(YESTERDAY_TITLE).first()).toBeVisible({ timeout: 10000 });
    // MAIN·CONTROL: 오늘 날짜 → 표시되지 않음
    if (TODAY.getDate() > 1) {
      await expect(page.getByText(MAIN_TITLE)).not.toBeVisible();
      await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
    }
  });

  test('기간 날짜 필터(이틀 전~오늘)에서 오늘 생성한 기록이 포함된다', async ({ page }) => {
    // 버그 재현: to=TODAY 를 '오늘 00:00'으로 해석하면 오늘 오후 기록이 제외됨
    // 수정 후: normalizeDateBoundary가 to를 '오늘 23:59:59'로 정규화
    await page.goto(`/map?start=${TWO_DAYS_AGO_STR}&end=${TODAY_STR}`);

    // MAIN·CONTROL: 오늘 날짜 → 기간 내 포함
    await expect(page.getByText(MAIN_TITLE).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(CONTROL_TITLE).first()).toBeVisible({ timeout: 8000 });
    // YESTERDAY: 어제 날짜 → 기간 내 포함
    await expect(page.getByText(YESTERDAY_TITLE).first()).toBeVisible({ timeout: 8000 });
  });

  test('태그+날짜 복합 필터 적용 시 두 조건을 모두 만족하는 기록만 표시된다', async ({ page }) => {
    await page.goto(
      `/map?tags=${encodeURIComponent(FILTER_TAG)}&start=${TODAY_STR}&end=${TODAY_STR}`,
    );

    // MAIN: 태그 있음 + 오늘 날짜 → 표시
    await expect(page.getByText(MAIN_TITLE).first()).toBeVisible({ timeout: 10000 });
    // CONTROL: 태그 없음 → 표시되지 않음
    await expect(page.getByText(CONTROL_TITLE)).not.toBeVisible();
    // YESTERDAY: 어제 날짜 → 표시되지 않음
    if (TODAY.getDate() > 1) {
      await expect(page.getByText(YESTERDAY_TITLE)).not.toBeVisible();
    }
  });
});
