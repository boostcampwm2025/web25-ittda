import { test, expect } from '@playwright/test';
import path from 'path';
import { uploadTestImage, deleteTestRecord } from './fixtures/api';

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const RECORD_TITLE = 'E2E 전체 블록 테스트 기록';
const RECORD_TEXT = 'E2E 전체 블록 테스트 본문입니다.';

test.describe.configure({ mode: 'serial' });

test.describe('개인 기록 전체 블록 유형 저장 및 확인', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === 'x-guest-access-token')?.value ?? '';

    // 이미지 업로드 (presign → PUT MinIO → complete)
    const mediaId = await uploadTestImage(page);

    const res = await page.request.post('/api/posts', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: RECORD_TITLE,
        blocks: [
          { type: 'DATE',     value: { date: TODAY },                                           layout: { row: 1, col: 1, span: 1 } },
          { type: 'TIME',     value: { time: '14:00' },                                         layout: { row: 1, col: 2, span: 1 } },
          { type: 'TEXT',     value: { text: RECORD_TEXT },                                     layout: { row: 2, col: 1, span: 2 } },
          { type: 'RATING',   value: { rating: 4 },                                             layout: { row: 3, col: 1, span: 1 } },
          { type: 'IMAGE',    value: { mediaIds: [mediaId] },                                   layout: { row: 4, col: 1, span: 2 } },
          { type: 'TABLE',    value: { rows: 2, cols: 2, cells: [['헤더1', '헤더2'], ['값1', '값2']] }, layout: { row: 5, col: 1, span: 2 } },
          { type: 'LOCATION', value: { lat: 37.5665, lng: 126.978, address: '서울특별시 중구 세종대로 110', placeName: '서울시청' }, layout: { row: 6, col: 1, span: 2 } },
        ],
        scope: 'PERSONAL',
      },
    });

    const body = await res.json();
    if (!body.success) throw new Error(`기록 생성 실패: ${JSON.stringify(body.error)}`);
    postId = body.data.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('상세 페이지에서 제목·본문·별점·이미지·표·위치를 모두 확인할 수 있다', async ({ page }) => {
    await page.goto(`/record/${postId}`);

    // 제목
    await expect(page.getByRole('heading', { name: RECORD_TITLE })).toBeVisible({ timeout: 8000 });

    // 본문 (TEXT)
    await expect(page.getByText(RECORD_TEXT)).toBeVisible({ timeout: 8000 });

    // 별점 (RATING) — "4 / 5"
    await expect(page.getByText('4 / 5')).toBeVisible({ timeout: 8000 });

    // 이미지 (IMAGE) — /api/media-image/{id} 프록시 URL 사용
    await expect(page.locator('img[src*="media-image"]').first()).toBeVisible({ timeout: 8000 });

    // 표 (TABLE) — td 셀 내용
    await expect(page.getByRole('cell', { name: '헤더1' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: '값1' })).toBeVisible({ timeout: 8000 });

    // 위치 (LOCATION) — placeName
    await expect(page.getByText('서울시청')).toBeVisible({ timeout: 8000 });
  });

  test('홈(/)에서 해당 기록의 모든 블록 내용을 확인할 수 있다', async ({ page }) => {
    await page.goto('/');

    // RecordItem: div.cursor-pointer 안에 BlockContent로 모든 블록이 렌더링됨
    const recordCard = page
      .locator('div[class*="cursor-pointer"]')
      .filter({ hasText: RECORD_TITLE })
      .first();
    await expect(recordCard).toBeVisible({ timeout: 10000 });

    // 제목
    await expect(recordCard.locator('h4', { hasText: RECORD_TITLE })).toBeVisible();

    // 본문 (TEXT)
    await expect(recordCard.getByText(RECORD_TEXT)).toBeVisible();

    // 별점 (RATING) — "4 / 5"
    await expect(recordCard.getByText('4 / 5')).toBeVisible();

    // 이미지 (IMAGE) — /api/media-image/{id} 프록시 img
    await expect(recordCard.locator('img[src*="media-image"]').first()).toBeVisible({ timeout: 8000 });

    // 표 (TABLE) — 셀 내용
    await expect(recordCard.getByRole('cell', { name: '헤더1' })).toBeVisible();

    // 위치 (LOCATION) — placeName
    await expect(recordCard.getByText('서울시청')).toBeVisible();
  });
});
