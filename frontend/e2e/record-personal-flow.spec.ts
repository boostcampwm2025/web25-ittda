import { test, expect } from '@playwright/test';
import path from 'path';
import { deleteTestRecord } from './fixtures/api';
import { RecordEditorPage } from './pages/RecordEditorPage';

/**
 * 개인 기록 작성 유저 시나리오
 *
 * 기존 커버리지:
 *  - 저장 후 상세 페이지 이동          → record-create.spec.ts
 *  - 상세 페이지 제목·텍스트 블록 표시  → record-detail.spec.ts (API 생성 방식)
 *
 * 이 파일에서 검증하는 것:
 *  1. UI로 저장 → 상세에서 작성자(닉네임) 섹션 표시
 *  2. 홈(/)에서 기록 제목 표시, 개인 기록이므로 작성자 닉네임 미표시
 */

const TODAY = new Date().toISOString().split('T')[0];
const RECORD_TITLE = 'E2E 시나리오 테스트 기록';
const RECORD_CONTENT = '시나리오 테스트 본문입니다.';

// 저장 후 생성된 postId를 두 번째 테스트에서 참조하기 위해 serial 모드
test.describe.configure({ mode: 'serial' });

test.describe('개인 기록 작성 → 상세 확인 → 홈 확인', () => {
  let postId: string;

  test.afterAll(async ({ browser }) => {
    if (!postId) return;
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  test('제목과 본문을 입력해 저장하면 상세 페이지에서 작성자 닉네임을 확인할 수 있다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'add', date: TODAY });

    await editor.fillTitle(RECORD_TITLE);
    await page.getByPlaceholder('어떤 기억이 있으신가요?').fill(RECORD_CONTENT);

    // 저장 버튼 클릭과 동시에 POST /api/posts 응답 대기
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/posts') && res.request().method() === 'POST',
        { timeout: 15000 },
      ),
      editor.save(),
    ]);

    // 저장 후 기록 상세 페이지로 이동
    await expect(page).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 10000 });
    postId = page.url().split('/record/')[1].split('?')[0];

    // 제목 확인
    await expect(page.getByRole('heading', { name: RECORD_TITLE })).toBeVisible({ timeout: 8000 });

    // 본문 확인
    await expect(page.getByText(RECORD_CONTENT)).toBeVisible();

    // 현재 유저 닉네임 조회 — 쿠키에서 토큰 추출 후 Authorization 헤더로 전달
    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === 'x-guest-access-token')?.value ?? '';
    const meRes = await page.request.get('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meBody = await meRes.json();
    const nickname: string = meBody?.data?.user?.nickname || 'anonymous';

    // 작성자 섹션 확인 — 페이지 하단에 위치하므로 스크롤
    // RecordDetail: <h2>작성자</h2> + contributor 닉네임(span.font-medium) + role 배지
    const authorHeading = page.getByRole('heading', { name: '작성자' });
    await authorHeading.scrollIntoViewIfNeeded();
    await expect(authorHeading).toBeVisible({ timeout: 5000 });

    // 실제 닉네임이 작성자 섹션에 표시되는지 확인
    // contributor.groupNickname || contributor.nickname → span.font-medium
    const nicknameBadge = page.locator('span.font-medium', { hasText: nickname });
    await expect(nicknameBadge).toBeVisible();
  });

  test('월별 카드에 해당 기록 제목이 포함된다', async ({ page }) => {
    await page.goto('/my');

    const CURRENT_YEAR = new Date().getFullYear();
    const CURRENT_MONTH = String(new Date().getMonth() + 1).padStart(2, '0');

    // 이번 달 카드 클릭 → 월별 상세
    const monthCard = page.getByRole('button').filter({
      hasText: new RegExp(`${CURRENT_YEAR}년 ${Number(CURRENT_MONTH)}월`),
    }).first();
    await expect(monthCard).toBeVisible({ timeout: 8000 });
    await monthCard.click();
    await expect(page).toHaveURL(/\/my\/month\/.+/, { timeout: 10000 });

    // 오늘 날짜 카드 클릭 → 일별 상세
    // DateRecordCard: span에 일(day) 숫자가 표시됨
    const todayDay = new Date().getDate().toString();
    const dateCard = page.getByRole('button').filter({
      has: page.locator('span').filter({ hasText: new RegExp(`^${todayDay}$`) }),
    }).first();
    await expect(dateCard).toBeVisible({ timeout: 8000 });
    await dateCard.click();
    await expect(page).toHaveURL(/\/my\/detail\/.+/, { timeout: 10000 });

    // 일별 상세는 ALL 기록을 나열 — latestTitle 경쟁 조건 없음
    const recordCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: RECORD_TITLE }).first();
    await expect(recordCard).toBeVisible({ timeout: 8000 });
  });

  test('일별 카드에 해당 기록 제목이 포함된다', async ({ page }) => {
    const CURRENT_YEAR = new Date().getFullYear();
    const CURRENT_MONTH = String(new Date().getMonth() + 1).padStart(2, '0');
    await page.goto(`/my/month/${CURRENT_YEAR}-${CURRENT_MONTH}`);

    // 오늘 날짜 카드 클릭 → 일별 상세
    const todayDay = new Date().getDate().toString();
    const dateCard = page.getByRole('button').filter({
      has: page.locator('span').filter({ hasText: new RegExp(`^${todayDay}$`) }),
    }).first();
    await expect(dateCard).toBeVisible({ timeout: 8000 });
    await dateCard.click();
    await expect(page).toHaveURL(/\/my\/detail\/.+/, { timeout: 10000 });

    // 일별 상세에서 기록 제목 확인
    const recordCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: RECORD_TITLE }).first();
    await expect(recordCard).toBeVisible({ timeout: 8000 });
  });

  test('홈(/)에서 해당 기록 제목을 찾을 수 있다(작성자 닉네임 미표시)', async ({ page }) => {
    await page.goto('/');

    // 홈 피드에서 방금 작성한 기록 제목 확인
    // HomeData → RecordList → 각 기록의 title 렌더링
    await expect(page.getByText(RECORD_TITLE)).toBeVisible({ timeout: 10000 });

    // 개인 기록은 홈에서 contributor 아바타/닉네임을 렌더링하지 않음
    // RecordList: `record.groupId &&` 조건이 false → contributor 섹션 미렌더링
    // "작성자" 레이블(h2)은 기록 상세에만 존재하고 홈 피드에는 없음
    await expect(page.getByRole('heading', { name: '작성자' })).not.toBeVisible();
  });
});
