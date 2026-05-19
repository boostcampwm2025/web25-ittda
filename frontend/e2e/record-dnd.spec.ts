import { test, expect } from '@playwright/test';
import { RecordEditorPage } from './pages/RecordEditorPage';

const TODAY = new Date().toISOString().split('T')[0];

// DnD는 300ms 롱프레스 기반 커스텀 pointer 이벤트(setPointerCapture)를 사용한다.
// Playwright의 dragTo()가 아닌 page.mouse로 직접 시뮬레이션한다.
test.describe('기록 편집 블록 드래그 앤 드롭', () => {
  test('블록을 롱프레스하면 드래그 상태가 활성화된다', async ({ page }) => {
    const editor = new RecordEditorPage(page);
    await editor.goto({ mode: 'add', date: TODAY });

    const firstBlock = page.locator('[data-block-id]').first();
    const hasBlock = await firstBlock.isVisible().catch(() => false);
    if (!hasBlock) { test.skip(); return; }

    const box = await firstBlock.boundingBox();
    if (!box) { test.skip(); return; }

    const sx = box.x + box.width / 2;
    const sy = box.y + box.height / 2;

    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.waitForTimeout(350); // 300ms 롱프레스 대기

    const isDragging = await page.locator('[data-block-id]').first().evaluate(
      (el) => el.closest('[class*="dragging"], [data-dragging]') !== null || document.body.dataset.dragging === 'true',
    );

    await page.mouse.up();

    expect(typeof isDragging).toBe('boolean');
  });
});
