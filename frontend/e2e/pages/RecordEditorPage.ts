import { Page, Locator } from '@playwright/test';

export class RecordEditorPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly saveButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByPlaceholder('제목을 입력하세요');
    this.saveButton = page.getByRole('button', { name: '저장' });
    this.backButton = page.getByRole('button', { name: '뒤로' });
  }

  async goto(options: { mode?: 'add' | 'edit'; postId?: string; groupId?: string; date?: string } = {}) {
    const params = new URLSearchParams();
    params.set('mode', options.mode ?? 'add');
    if (options.postId) params.set('postId', options.postId);
    if (options.groupId) params.set('groupId', options.groupId);
    if (options.date) params.set('date', options.date);
    await this.page.goto(`/add?${params.toString()}`);
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async save() {
    await this.saveButton.click();
  }

  async dragBlock(sourceSelector: string, targetSelector: string) {
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) return;

    const sx = sourceBox.x + sourceBox.width / 2;
    const sy = sourceBox.y + sourceBox.height / 2;
    const tx = targetBox.x + targetBox.width / 2;
    const ty = targetBox.y + targetBox.height / 2;

    // 300ms 롱프레스 후 드래그 (커스텀 pointer 이벤트 기반 DnD)
    await this.page.mouse.move(sx, sy);
    await this.page.mouse.down();
    await this.page.waitForTimeout(350);
    await this.page.mouse.move(tx, ty, { steps: 15 });
    await this.page.mouse.up();
  }
}
