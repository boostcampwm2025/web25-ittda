import { describe, it, expect, vi, afterEach } from 'vitest';
import { getImageDimensions } from './image';

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 0;
  height = 0;
  private _src = '';

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    if (value.includes('error')) {
      queueMicrotask(() => this.onerror?.());
    } else {
      this.width = 800;
      this.height = 600;
      queueMicrotask(() => this.onload?.());
    }
  }
}

describe('getImageDimensions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('이미지 로드에 성공하면 가로/세로를 반환한다', async () => {
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:ok');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const file = new File(['content'], 'photo.png', { type: 'image/png' });
    await expect(getImageDimensions(file)).resolves.toEqual({
      width: 800,
      height: 600,
    });
    expect(revokeSpy).toHaveBeenCalledWith('blob:ok');
  });

  it('이미지 로드에 실패하면 에러로 reject한다', async () => {
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:error');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const file = new File(['content'], 'broken.png', { type: 'image/png' });
    await expect(getImageDimensions(file)).rejects.toThrow(
      '이미지 로드 실패: broken.png',
    );
  });
});
