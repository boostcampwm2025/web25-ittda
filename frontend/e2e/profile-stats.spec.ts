import { test, expect } from '@playwright/test';
import path from 'path';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

const TODAY = new Date().toISOString().split('T')[0];
const TAG_NAME = 'E2E테스트태그';
const PLACE_NAME = '서울시청';
const MOOD = '행복';

test.describe('마이페이지 통계', () => {
  // 태그 2회 사용 → "자주 사용" 탭에도 노출, 위치+감정 1회
  const postIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();

    // 태그 2회 사용 (최근 사용 + 자주 사용 탭 모두 노출)
    // 태그는 top-level 필드가 아니라 type:'tags' 블록으로 저장됨
    for (let i = 1; i <= 2; i++) {
      const r = await createTestRecord(page, `E2E 태그 기록 ${i}`, TODAY, {
        extraBlocks: [
          { type: 'TAG', value: { tags: [TAG_NAME] }, layout: { row: 3, col: 1, span: 2 } },
        ],
      });
      postIds.push(r.id);
    }

    // 위치 + 감정 블록 포함 기록
    const r = await createTestRecord(page, 'E2E 위치·감정 기록', TODAY, {
      extraBlocks: [
        {
          type: 'MOOD',
          value: { mood: MOOD },
          layout: { row: 3, col: 1, span: 2 },
        },
        {
          type: 'LOCATION',
          value: {
            lat: 37.5665,
            lng: 126.978,
            address: '서울특별시 중구 세종대로 110',
            placeName: PLACE_NAME,
          },
          layout: { row: 4, col: 1, span: 2 },
        },
      ],
    });
    postIds.push(r.id);

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

  test('기록에 사용한 태그를 최근 사용·자주 사용 탭에서 확인할 수 있다', async ({ page }) => {
    await page.goto('/profile');

    // 최근 사용 탭 (기본 활성) — hydration 과정에서 SSR/CSR 두 요소가 잠깐 공존할 수 있어 .first() 사용
    await expect(page.getByText('최근 사용').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(TAG_NAME).first()).toBeVisible({ timeout: 8000 });

    // 자주 사용 탭으로 전환
    await page.getByText('자주 사용').first().click();
    await expect(page.getByText(TAG_NAME).first()).toBeVisible({ timeout: 5000 });
  });

  test('위치·감정 기록 생성 후 방문 장소 통계와 자주 사용된 감정을 확인할 수 있다', async ({
    page,
  }) => {
    await page.goto('/profile');

    // PlaceDashboard·EmotionDashboard는 "통계 더보기" 클릭 후에 렌더링됨
    // getByText는 <span>과 부모 <button> 둘 다 매칭하므로 role로 좁힘
    await expect(page.getByRole('button', { name: '통계 더보기' })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: '통계 더보기' }).click();

    // 방문 장소 통계 섹션
    await expect(page.getByRole('heading', { name: '방문 장소 통계' })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByText(PLACE_NAME)).toBeVisible({ timeout: 8000 });

    // 자주 사용된 감정 섹션
    await expect(page.getByRole('heading', { name: '자주 사용된 감정' })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByText(MOOD)).toBeVisible({ timeout: 8000 });
  });

  test('기록 생성 후 마이페이지에서 작성 기록 통계가 증가한다', async ({ page }) => {
    // 현재 totalPosts 조회
    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === 'x-guest-access-token')?.value ?? '';
    const meRes = await page.request.get('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meBody = await meRes.json();
    const initialCount: number = meBody?.data?.user?.stats?.totalPosts ?? 0;

    // 새 기록 생성
    const { id: newPostId } = await createTestRecord(page, 'E2E 통계 변화 테스트 기록');

    try {
      await page.goto('/profile');

      // "작성한 기록" 항목의 카운트 수치 추출 — hydration 중복 방지를 위해 .first()
      await expect(page.getByText('작성한 기록').first()).toBeVisible({ timeout: 8000 });
      const countText = await page
        .getByText('작성한 기록', { exact: true })
        .first()
        .locator('xpath=..')
        .locator('span')
        .filter({ hasText: /^\d+$/ })
        .textContent();

      expect(Number(countText?.trim())).toBeGreaterThanOrEqual(initialCount + 1);
    } finally {
      await deleteTestRecord(page, newPostId);
    }
  });
});
