import { test, expect } from '@playwright/test';
import path from 'path';
import {
  createTestGroup,
  deleteTestGroup,
  createGuestSession,
  joinTestGroup,
  createTestDraft,
  deleteTestRecord,
} from './fixtures/api';

const DRAFT_TEXT = 'E2E 공동 기록 실시간 텍스트';
const LOCK_RELEASE_TEXT = 'B가 락 해제 후 편집한 텍스트';
const TITLE_TEXT = 'E2E 공동기록 제목 동기화';

async function openDraftAsTwoMembers(
  browser: import('@playwright/test').Browser,
  groupId: string,
  inviteCode: string,
  draftId: string,
) {
  const ctxA = await browser.newContext({
    storageState: path.join(__dirname, '.auth/guest.json'),
  });
  const ctxB = await createGuestSession(browser);
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await joinTestGroup(pageB, inviteCode);

  const draftUrl = `/group/${groupId}/post/${draftId}`;
  await Promise.all([pageA.goto(draftUrl), pageB.goto(draftUrl)]);

  const textInputA = pageA.getByPlaceholder('어떤 기억이 있으신가요?');
  const textInputB = pageB.getByPlaceholder('어떤 기억이 있으신가요?');
  await expect(textInputA).toBeVisible({ timeout: 15000 });
  await expect(textInputB).toBeVisible({ timeout: 15000 });

  // 두 소켓이 같은 draft room에 완전히 연결됨을 보장
  await expect(pageA.getByText(/2명.*편집 중/)).toBeVisible({ timeout: 15000 });
  await expect(pageB.getByText(/2명.*편집 중/)).toBeVisible({ timeout: 15000 });

  return { ctxA, ctxB, pageA, pageB, textInputA, textInputB };
}

test.describe('공동 기록 실시간 협업', () => {
  test.describe.configure({ mode: 'serial' });

  let groupId: string;
  let inviteCode: string;
  let draftId: string;

  test.beforeAll(async ({ browser }) => {
    // 멤버 A: 기존 게스트 계정으로 그룹 생성
    const ctxA = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const pageA = await ctxA.newPage();

    const group = await createTestGroup(pageA, 'E2E 공동기록 테스트 그룹');
    groupId = group.id;
    inviteCode = group.inviteCode;

    // 멤버 B: 새 게스트 계정으로 그룹 참여
    const ctxB = await createGuestSession(browser);
    const pageB = await ctxB.newPage();
    await joinTestGroup(pageB, inviteCode);

    // 멤버 A가 draft 생성
    draftId = await createTestDraft(pageA, groupId);

    await ctxA.close();
    await ctxB.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctxA = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const pageA = await ctxA.newPage();
    await deleteTestGroup(pageA, groupId);
    await ctxA.close();
  });

  test('공동 기록 draft 생성 시 그룹 홈 floating button에 진행 중인 draft 수가 표시된다', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/guest.json'),
    });
    const page = await ctx.newPage();

    try {
      await page.goto(`/group/${groupId}`);
      await page
        .waitForLoadState('networkidle', { timeout: 30000 })
        .catch(() => {});

      // floating button에 draft 개수 badge가 표시되는지 확인
      const badge = page
        .locator('span')
        .filter({ hasText: /^[1-9]\d*$/ })
        .first();
      await expect(badge).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  test('한 멤버가 블록 내용을 수정하면 다른 멤버 화면에 실시간으로 반영된다', async ({
    browser,
  }) => {
    const { ctxA, ctxB, pageB, textInputA } = await openDraftAsTwoMembers(
      browser,
      groupId,
      inviteCode,
      draftId,
    );
    try {
      // 멤버 A가 텍스트 블록에 실제 타이핑으로 입력 (BLOCK_VALUE_STREAM 트리거)
      await textInputA.click();
      await textInputA.pressSequentially(DRAFT_TEXT, { delay: 50 });

      // 멤버 B 화면에 실시간으로 반영 확인 (BLOCK_VALUE_STREAM)
      await expect(pageB.getByText(DRAFT_TEXT)).toBeVisible({ timeout: 10000 });

      // A가 blur → PATCH_APPLY → PATCH_COMMITTED, B에서 확정된 값으로 표시
      await textInputA.press('Tab');
      await expect(pageB.getByText(DRAFT_TEXT)).toBeVisible({ timeout: 5000 });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('한 멤버가 블록을 편집 중이면 다른 멤버 화면에 잠금 아이콘이 표시된다', async ({
    browser,
  }) => {
    const { ctxA, ctxB, pageB, textInputA } = await openDraftAsTwoMembers(
      browser,
      groupId,
      inviteCode,
      draftId,
    );
    try {
      // 멤버 A가 블록 클릭 → LOCK_ACQUIRE → LOCK_GRANTED → LOCK_CHANGED 브로드캐스트
      await textInputA.click();

      // 멤버 B 화면에 락 아이콘(animate-pulse 원형 아바타)이 나타나는지 확인
      const lockIndicator = pageB.locator('[class*="animate-pulse"]');
      await expect(lockIndicator).toBeVisible({ timeout: 10000 });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('편집 중인 멤버가 블록을 떠나면 잠금이 해제되어 다른 멤버가 편집할 수 있다', async ({
    browser,
  }) => {
    const { ctxA, ctxB, pageA, pageB, textInputA, textInputB } =
      await openDraftAsTwoMembers(browser, groupId, inviteCode, draftId);
    try {
      // A가 블록 클릭 → 락 획득, B에서 lock indicator 확인
      await textInputA.click();
      const lockIndicator = pageB.locator('[class*="animate-pulse"]');
      await expect(lockIndicator).toBeVisible({ timeout: 10000 });

      // A가 blur → LOCK_RELEASE, B에서 lock indicator 사라짐
      await textInputA.press('Tab');
      await expect(lockIndicator).not.toBeVisible({ timeout: 8000 });

      // B가 이제 같은 블록을 편집할 수 있음 (LOCK_GRANTED)
      await textInputB.click();
      await textInputB.fill('');
      await textInputB.pressSequentially(LOCK_RELEASE_TEXT, { delay: 50 });

      // A 화면에 B가 입력한 내용이 반영됨
      await expect(pageA.getByText(LOCK_RELEASE_TEXT)).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('한 멤버가 블록 레이아웃을 이동하면 다른 멤버 화면에 반영된다', async ({
    browser,
  }) => {
    const { ctxA, ctxB, pageA, pageB } = await openDraftAsTwoMembers(
      browser,
      groupId,
      inviteCode,
      draftId,
    );
    try {
      const blocksA = pageA.locator('[data-block-id]');
      const blocksB = pageB.locator('[data-block-id]');
      await expect(blocksA).toHaveCount(3);
      await expect(blocksB).toHaveCount(3);

      const initialIds = await blocksA.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-block-id')),
      );
      const sourceId = initialIds[1]!;
      const targetId = initialIds[0]!;

      // 첫 pointermove로 마우스 드래그 임계값을 넘긴다.
      await pageA.evaluate((id) => {
        const source = document.querySelector<HTMLElement>(
          `[data-block-id="${id}"]`,
        )!;
        const rect = source.getBoundingClientRect();
        const common = {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          clientY: rect.top + rect.height / 2,
        };
        source.dispatchEvent(
          new PointerEvent('pointerdown', {
            ...common,
            clientX: rect.left + rect.width / 2,
          }),
        );
        document.dispatchEvent(
          new PointerEvent('pointermove', {
            ...common,
            clientX: rect.left + rect.width / 2 + 10,
          }),
        );
      }, sourceId);
      await pageA.waitForTimeout(30);

      // 이동과 종료를 같은 이벤트 턴에 발생시켜 최신 blocksRef 전송도 함께 검증한다.
      await pageA.evaluate((id) => {
        const target = document.querySelector<HTMLElement>(
          `[data-block-id="${id}"]`,
        )!;
        const rect = target.getBoundingClientRect();
        const common = {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          clientX: rect.left + rect.width * 0.1,
          clientY: rect.top + rect.height / 2,
        };
        document.dispatchEvent(new PointerEvent('pointermove', common));
        document.dispatchEvent(new PointerEvent('pointerup', common));
      }, targetId);

      const expectedIds = [initialIds[1], initialIds[0], initialIds[2]];
      await expect
        .poll(() =>
          blocksA.evaluateAll((elements) =>
            elements.map((element) => element.getAttribute('data-block-id')),
          ),
        )
        .toEqual(expectedIds);

      await expect
        .poll(() =>
          blocksB.evaluateAll((elements) =>
            elements.map((element) => element.getAttribute('data-block-id')),
          ),
        )
        .toEqual(expectedIds);

      // 서버 스냅샷 배열 순서까지 저장되어 재접속 후에도 이동이 유지되는지 확인한다.
      await pageB.reload();
      await expect(
        pageB.getByPlaceholder('어떤 기억이 있으신가요?'),
      ).toBeVisible({ timeout: 15000 });
      await expect
        .poll(() =>
          pageB
            .locator('[data-block-id]')
            .evaluateAll((elements) =>
              elements.map((element) => element.getAttribute('data-block-id')),
            ),
        )
        .toEqual(expectedIds);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('멤버가 draft 페이지를 떠나면 다른 멤버의 편집 중 인원 수가 감소한다', async ({
    browser,
  }) => {
    const { ctxA, ctxB, pageA, pageB } = await openDraftAsTwoMembers(
      browser,
      groupId,
      inviteCode,
      draftId,
    );
    try {
      // B가 draft 페이지를 떠남 → LEAVE_DRAFT 이벤트 발생
      await pageB.goto('/');

      // A 화면에서 인원 수가 1명으로 줄어듦 (PRESENCE_LEFT 수신)
      await expect(pageA.getByText(/1명.*편집 중/)).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('한 멤버가 제목을 입력하면 다른 멤버 화면에 실시간으로 반영된다', async ({
    browser,
  }) => {
    const { ctxA, ctxB, pageA, pageB } = await openDraftAsTwoMembers(
      browser,
      groupId,
      inviteCode,
      draftId,
    );
    try {
      const titleInputA = pageA.getByPlaceholder('제목을 입력하세요');
      const titleInputB = pageB.getByPlaceholder('제목을 입력하세요');
      await expect(titleInputA).toBeVisible({ timeout: 10000 });
      await expect(titleInputB).toBeVisible({ timeout: 10000 });

      // A가 제목 입력 (BLOCK_SET_TITLE 패치)
      await titleInputA.click();
      await titleInputA.pressSequentially(TITLE_TEXT, { delay: 50 });

      // B 화면에 제목 반영 확인 (input value는 toHaveValue로 검증)
      await expect(titleInputB).toHaveValue(TITLE_TEXT, { timeout: 10000 });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('한 멤버가 저장하면 모든 멤버 화면에 저장 로더가 표시되고, 저장 완료 후 기록 상세에서 편집 참여자가 역할과 함께 표시된다', async ({
    browser,
  }) => {
    const { ctxA, ctxB, pageA, pageB, textInputB } =
      await openDraftAsTwoMembers(browser, groupId, inviteCode, draftId);
    let postId: string | null = null;
    try {
      // B가 블록을 편집해 contributor로 등록 (PATCH_COMMITTED)
      await textInputB.click();
      await textInputB.fill('');
      await textInputB.pressSequentially('B참여자등록텍스트', { delay: 50 });
      await textInputB.press('Tab');

      // B의 패치가 서버에 커밋되어 A 화면에 반영될 때까지 대기
      // → 이 시점에 draftStateService.getTouchedBy()에 B의 userId가 등록됨
      await expect(pageA.getByText('B참여자등록텍스트')).toBeVisible({
        timeout: 10000,
      });

      // A가 저장 버튼 클릭 → DRAFT_PUBLISH_STARTED 브로드캐스트
      const saveBtn = pageA.getByRole('button', { name: '저장' });
      await expect(saveBtn).toBeVisible({ timeout: 10000 });

      // 오버레이 리스너를 먼저 등록한 후 저장 — 빠른 저장으로 오버레이를 놓치지 않도록
      const overlayAppeared = pageB
        .locator('[data-auth-loading]')
        .waitFor({ state: 'visible', timeout: 8000 })
        .catch(() => {});
      await saveBtn.click();
      await overlayAppeared; // DRAFT_PUBLISH_STARTED → isPublishing = true

      // 저장 완료 후 A와 B 모두 기록 상세 페이지로 이동 (DRAFT_PUBLISHED)
      await expect(pageA).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 20000 });
      await expect(pageB).toHaveURL(/\/record\/[a-z0-9-]+/, { timeout: 20000 });
      expect(pageA.url()).toBe(pageB.url());

      postId = pageA.url().split('/record/')[1]?.split('?')[0] ?? null;

      // 기록 상세 페이지의 작성자 섹션이 렌더링됐는지 확인
      const contributorsHeading = pageA.getByRole('heading', {
        name: '작성자',
      });
      await expect(contributorsHeading).toBeVisible({ timeout: 8000 });

      // 역할 배지(span)로 기여자 등록 여부 검증 — h2 헤딩 "작성자"와 구분되어 span만 매칭됨
      // 서버 정책: 모든 기여자에게 AUTHOR 역할 할당 → UI에서 "작성자" 배지로 표시됨
      const roleBadges = pageA
        .locator('span')
        .filter({ hasText: /^(작성자|편집자)$/ });
      await expect(roleBadges.first()).toBeVisible({ timeout: 8000 });
      // 저장자(A)와 편집 참여자(B) 모두 기여자로 표시됨
      await expect(roleBadges.nth(1)).toBeVisible({ timeout: 5000 });
    } finally {
      if (postId) await deleteTestRecord(pageA, postId).catch(() => {});
      await ctxA.close();
      await ctxB.close();
    }
  });
});
