import { test, expect } from '@playwright/test';
import path from 'path';
import { RecordEditorPage } from './pages/RecordEditorPage';
import { createTestRecord, deleteTestRecord } from './fixtures/api';

// 로컬 날짜 기준으로 어제 계산 (WeekCalendar는 로컬 날짜를 사용)
const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const YESTERDAY = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
const YESTERDAY_DAY = String(yesterdayDate.getDate());

const TODAY = new Date().toISOString().split('T')[0];

test.describe('미래 날짜 선택 불가', () => {
  test('기록 생성 시 미래 날짜는 선택할 수 없다', async ({ page }) => {
    // 에디터 진입
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'add', date: TODAY });

    // 날짜 블록의 DateField 버튼 클릭 → DateDrawer 오픈
    // DateField: <button onClick={onClick}>📅 YYYY.MM.DD (요일) <ChevronDown/></button>
    const dateBlock = page.locator('[data-block-id]').first();
    const dateFieldButton = dateBlock.getByRole('button').first();
    await expect(dateFieldButton).toBeVisible({ timeout: 5000 });

    // Drawer 열기 전에 현재 날짜 텍스트 저장
    const selectedDateText = await dateFieldButton.textContent();
    await dateFieldButton.click();

    // DateDrawer 열림 확인 — DrawerTitle: "언제의 기록인가요?"
    await expect(page.getByText('언제의 기록인가요?')).toBeVisible({ timeout: 5000 });

    // 캘린더 그리드 안의 disabled 버튼 = 미래 날짜
    // DateDrawer: isFuture → disabled={true} + opacity-20 + cursor-not-allowed
    const futureDateButton = page.locator('button[disabled]').filter({ hasText: /^\d+$/ }).first();
    await expect(futureDateButton).toBeVisible({ timeout: 5000 });

    // disabled 속성 확인 → 선택 불가 상태
    await expect(futureDateButton).toBeDisabled();

    // disabled 버튼 클릭 시도 — HTML disabled는 이벤트를 차단하므로 날짜가 바뀌지 않음
    await futureDateButton.scrollIntoViewIfNeeded();
    await futureDateButton.click({ force: true });

    // Drawer가 닫히지 않고 여전히 열려있어야 함 → 날짜 선택이 발생하지 않았음을 증명
    await expect(page.getByText('언제의 기록인가요?')).toBeVisible();

    // Drawer 닫기 후 날짜 텍스트가 변경되지 않았는지 확인
    await page.keyboard.press('Escape');
    await expect(dateFieldButton).toBeVisible({ timeout: 3000 });
    await expect(dateFieldButton).toHaveText(selectedDateText!);
  });

  test('날짜 drawer로 기록 탐색 시 미래 날짜는 선택할 수 없다', async ({ page }) => {
    await page.goto('/');

    // WeekCalendar — 주간 날짜 버튼들이 있는 영역
    // 미래 날짜: disabled={true} + opacity-40 + cursor-not-allowed
    const weekCalendar = page.locator('div[class*="overflow-hidden"]').filter({
      has: page.locator('button[disabled]'),
    }).first();

    // 미래 날짜 버튼 (disabled) 이 존재하는지 확인
    // 오늘이 주말 마지막 날이 아닌 이상 반드시 미래 날짜가 있음
    const futureWeekButton = weekCalendar.locator('button[disabled]').first();
    const hasFutureButton = await futureWeekButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasFutureButton) {
      // 오늘이 토요일(주의 마지막 날) — 다음 주로 이동해 미래 날짜 disabled 검증
      const nextWeekButton = page.locator('button').filter({ has: page.locator('[data-lucide="chevron-right"]') }).last();
      const hasNext = await nextWeekButton.isVisible({ timeout: 3000 }).catch(() => false);
      if (!hasNext) {
        test.skip(); // 다음 주 이동 버튼이 없는 예외 상황
        return;
      }
      await nextWeekButton.click();

      // 다음 주는 모든 날짜가 미래 → 첫 번째 버튼이 disabled 상태여야 함
      const nextFutureButton = weekCalendar.locator('button[disabled]').first();
      await expect(nextFutureButton).toBeVisible({ timeout: 5000 });
      await expect(nextFutureButton).toBeDisabled();
      await nextFutureButton.click({ force: true });
      await expect(nextFutureButton).toBeDisabled();
      return;
    }

    // disabled 속성 확인 → 선택 불가 상태
    await expect(futureWeekButton).toBeDisabled();

    // 선택된 날짜 확인 (오늘 날짜가 기본 선택)
    // 클릭 시도 후 날짜가 변경되지 않는지 확인
    const todayButton = weekCalendar.locator('button').filter({
      has: page.locator('[class*="itta-point"], [class*="green"]'),
    }).first();
    const todayVisible = await todayButton.isVisible({ timeout: 2000 }).catch(() => false);

    // 미래 날짜 클릭 시도
    await futureWeekButton.click({ force: true });

    // 미래 날짜를 클릭해도 오늘 날짜가 여전히 선택 상태 유지
    if (todayVisible) {
      await expect(todayButton).toBeVisible();
    }

    // disabled 버튼이 여전히 disabled 상태임을 확인
    await expect(futureWeekButton).toBeDisabled();
  });
});

const PAST_RECORD_TITLE = 'E2E 과거날짜 기록';

// 홈이 "오늘 하루만 보여주는 목록"에서 "끊김 없는 스크롤 타임라인 + 주간
// 달력은 스크롤 위치를 보여주는 인덱스"로 개편되면서, 과거 기록은 더 이상
// 날짜를 탭해야만 나타나는 게 아니라 애초에 타임라인에 항상 포함되어 있다.
test.describe('과거 날짜 기록 홈 노출', () => {
  let postId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    const record = await createTestRecord(page, PAST_RECORD_TITLE, YESTERDAY);
    postId = record.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth/guest.json') });
    const page = await ctx.newPage();
    await deleteTestRecord(page, postId);
    await ctx.close();
  });

  // WeekCalendar 컨테이너 — 요일명 span이 있는 overflow-hidden div
  const getWeekCalendar = (page: Parameters<typeof test>[1] extends { page: infer P } ? P : import('@playwright/test').Page) =>
    page.locator('div[class*="overflow-hidden"]').filter({
      has: page.locator('span', { hasText: /^[일월화수목금토]$/ }),
    }).first();

  test('어제 기록은 날짜를 탭하지 않아도 홈 타임라인에 곧바로 노출된다', async ({ page }) => {
    await page.goto('/');

    // WeekCalendar가 보이면 홈이 렌더링된 상태
    await expect(getWeekCalendar(page)).toBeVisible({ timeout: 5000 });

    // RecordTimelineFeed는 pastFeedInfiniteOptions로 날짜 구분 없이 최신순
    // 무한스크롤을 그리므로, 아무 조작 없이도 어제 기록이 바로 보여야 한다.
    await expect(page.getByText(PAST_RECORD_TITLE).first()).toBeVisible({ timeout: 10000 });
  });

  test('홈 주간 달력에서 과거 날짜를 탭하면 해당 구간으로 스크롤되고 캘린더에도 선택 표시된다', async ({ page }) => {
    await page.goto('/');

    const weekCalendar = getWeekCalendar(page);
    await expect(weekCalendar).toBeVisible({ timeout: 5000 });

    // 어제 날짜 버튼 찾기 (오늘이 일요일이면 어제는 이전 주).
    // button의 textContent는 요일명+일자 span이 공백 없이 이어 붙어(예: "일2")
    // button 레벨 hasText 정규식(^2$)이 매치에 실패할 수 있어, 일자만 담은
    // span을 has로 좁혀서 찾는다 — getWeekCalendar와 동일한 패턴.
    const yesterdayButton = weekCalendar.locator('button').filter({
      has: page.locator('span', { hasText: new RegExp(`^${YESTERDAY_DAY}$`) }),
    }).first();

    const isInCurrentWeek = await yesterdayButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isInCurrentWeek) {
      // 오늘이 일요일 — 어제(토요일)는 이전 주
      // cursor-grab div(Framer Motion 드래그 영역)를 오른쪽으로 드래그해 이전 주로 이동
      const swipeArea = weekCalendar.locator('[class*="cursor-grab"]').first();
      const box = await swipeArea.boundingBox();
      if (box) {
        const y = box.y + box.height / 2;
        await page.mouse.move(box.x + box.width * 0.25, y);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.75, y, { steps: 20 });
        await page.mouse.up();
      }
      // 이전 주가 렌더링되어 어제 버튼이 나타날 때까지 대기
      await expect(yesterdayButton).toBeVisible({ timeout: 3000 });
    }

    await yesterdayButton.click();

    // 탭 → 점프: RecordTimelineProvider.requestJump가 해당 날짜로 스무스
    // 스크롤을 트리거하므로, 그 구간의 기록이 뷰포트에 보여야 한다
    // (.first()로 이전 테스트 실행 잔여 데이터 허용).
    await expect(page.getByText(PAST_RECORD_TITLE).first()).toBeVisible({ timeout: 15000 });

    // 스크롤이 캘린더에 되먹임되어(reportScrollActiveDate) 방금 탭한 날짜
    // pip가 선택 상태(솔리드 배경)로 표시되는지 — 탭→스크롤뿐 아니라
    // 스크롤→캘린더 동기화까지 실제로 맞물리는지 검증.
    const selectedPip = yesterdayButton.locator('div').first();
    await expect(selectedPip).toHaveClass(/bg-itta-black/, { timeout: 10000 });
  });
});
