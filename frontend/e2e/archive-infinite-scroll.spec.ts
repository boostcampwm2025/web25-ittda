import { test, expect, type BrowserContext } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  deleteTestGroup,
  createTestRecord,
  deleteTestRecord,
  createGuestSession,
} from './fixtures/api';

const CURRENT_YEAR = new Date().getFullYear();
const PREV_YEAR = CURRENT_YEAR - 1;
const CURSOR = 'test-cursor-page-2';

function makeMonthItem(year: number, month: number) {
  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    count: 2,
    coverAssetId: null,
    latestTitle: `${year}년 ${month}월 기록`,
    latestLocation: null,
  };
}

// 첫 페이지: 현재 연도 6개월 + nextCursor 있음
const FIRST_PAGE_ITEMS = Array.from({ length: 6 }, (_, i) =>
  makeMonthItem(CURRENT_YEAR, 12 - i),
);

// 두 번째 페이지: 이전 연도 3개월 + nextCursor 없음
const SECOND_PAGE_ITEMS = Array.from({ length: 3 }, (_, i) =>
  makeMonthItem(PREV_YEAR, 12 - i),
);

function mockPersonalArchiveRoute(page: import('@playwright/test').Page) {
  return page.route('**/api/user/archives/months*', async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: cursor
          ? { items: SECOND_PAGE_ITEMS, nextCursor: null }
          : { items: FIRST_PAGE_ITEMS, nextCursor: CURSOR },
      }),
    });
  });
}

function mockGroupArchiveRoute(page: import('@playwright/test').Page) {
  return page.route('**/api/groups/*/archives/months*', async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: cursor
          ? { items: SECOND_PAGE_ITEMS, nextCursor: null }
          : { items: FIRST_PAGE_ITEMS, nextCursor: CURSOR },
      }),
    });
  });
}

test.describe('개인 보관함 무한스크롤', () => {
  test.use({ storageState: path.join(__dirname, '.auth/guest.json') });

  test.beforeEach(async ({ page }) => {
    await mockPersonalArchiveRoute(page);
  });

  test('첫 페이지 월별 카드가 표시된다', async ({ page }) => {
    await page.goto('/my');
    const card = page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
  });

  test('현재 연도 데이터에 "이번 해" 연도 헤더가 표시된다', async ({ page }) => {
    await page.goto('/my');
    await expect(page.getByText('이번 해', { exact: true })).toBeVisible({ timeout: 8000 });
  });

  test('스크롤 시 다음 페이지 카드가 기존 목록 아래에 추가된다', async ({ page }) => {
    await page.goto('/my');

    await expect(
      page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }).first(),
    ).toBeVisible({ timeout: 8000 });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(
      page.getByRole('button').filter({ hasText: new RegExp(`${PREV_YEAR}년 \\d{1,2}월`) }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test('이전 연도 카드 로드 시 연도 구분 헤더가 표시된다', async ({ page }) => {
    await page.goto('/my');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(page.getByText(`${PREV_YEAR}년`, { exact: true })).toBeVisible({ timeout: 8000 });
  });

  test('두 페이지를 합산한 카드 수가 모두 표시된다', async ({ page }) => {
    await page.goto('/my');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const allCards = page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ });
    await expect(allCards).toHaveCount(FIRST_PAGE_ITEMS.length + SECOND_PAGE_ITEMS.length, {
      timeout: 8000,
    });
  });

  test('마지막 페이지 도달 후 추가 API 요청이 발생하지 않는다', async ({ page }) => {
    const archiveRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/user/archives/months')) {
        archiveRequests.push(req.url());
      }
    });

    await page.goto('/my');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 두 번째 페이지 렌더링 완료 대기
    await expect(
      page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }),
    ).toHaveCount(FIRST_PAGE_ITEMS.length + SECOND_PAGE_ITEMS.length, { timeout: 8000 });

    // 추가 스크롤 후 요청 수가 변하지 않는다
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(
      page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }),
    ).toHaveCount(FIRST_PAGE_ITEMS.length + SECOND_PAGE_ITEMS.length, { timeout: 3000 });

    expect(archiveRequests).toHaveLength(2);
  });
});

test.describe('그룹 보관함 무한스크롤', () => {
  let groupId: string;
  let guestCtx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    guestCtx = await createGuestSession(browser);
    const page = await guestCtx.newPage();
    const group = await createTestGroup(page, 'E2E 무한스크롤 테스트 그룹');
    groupId = group.id;
    await page.close();
  });

  test.afterAll(async () => {
    if (!guestCtx) return;
    const page = await guestCtx.newPage();
    await deleteTestGroup(page, groupId);
    await guestCtx.close();
  });

  test('그룹 보관함 탭에서 월별 카드가 표시된다', async () => {
    const page = await guestCtx.newPage();
    try {
      await mockGroupArchiveRoute(page);
      await page.goto(`/group/${groupId}?tab=archive`);
      const card = page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }).first();
      await expect(card).toBeVisible({ timeout: 8000 });
    } finally {
      await page.close();
    }
  });

  test('그룹 보관함에서 스크롤 시 다음 페이지 카드가 추가된다', async () => {
    const page = await guestCtx.newPage();
    try {
      await mockGroupArchiveRoute(page);
      await page.goto(`/group/${groupId}?tab=archive`);
      await expect(
        page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }).first(),
      ).toBeVisible({ timeout: 8000 });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      await expect(
        page.getByRole('button').filter({ hasText: new RegExp(`${PREV_YEAR}년 \\d{1,2}월`) }).first(),
      ).toBeVisible({ timeout: 8000 });
    } finally {
      await page.close();
    }
  });
});

test.describe('연도 필터 보관함 (무한스크롤 없음)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/guest.json') });

  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const page = await ctx.newPage();
    const record = await createTestRecord(page, 'E2E 연도 필터 테스트 기록');
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

  test('연도 필터 페이지에서 해당 연도의 월별 카드가 표시된다', async ({ page }) => {
    await page.goto(`/my/year/${CURRENT_YEAR}`);
    const card = page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
  });

  test('스크롤해도 카드가 추가되지 않고 cursor 요청이 발생하지 않는다', async ({ page }) => {
    const cursorRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('cursor=')) cursorRequests.push(req.url());
    });

    await page.goto(`/my/year/${CURRENT_YEAR}`);
    const allCards = page.getByRole('button').filter({ hasText: /\d{4}년 \d{1,2}월/ });
    await expect(allCards.first()).toBeVisible({ timeout: 8000 });
    const countBefore = await allCards.count();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(allCards).toHaveCount(countBefore, { timeout: 3000 });

    expect(cursorRequests).toHaveLength(0);
  });
});
