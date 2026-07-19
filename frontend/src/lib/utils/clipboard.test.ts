import { describe, it, expect, vi, afterEach } from 'vitest';

const { getPlatformMock } = vi.hoisted(() => ({
  getPlatformMock: vi.fn(() => 'web'),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: getPlatformMock },
}));

const clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@capacitor/clipboard', () => ({
  Clipboard: { write: clipboardWriteMock },
}));

import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clipboardWriteMock.mockClear();
    getPlatformMock.mockReturnValue('web');
  });

  it('android Capacitor 플랫폼이면 네이티브 Clipboard 플러그인을 사용한다', async () => {
    getPlatformMock.mockReturnValue('android');

    await copyToClipboard('안드로이드 복사 텍스트');

    expect(clipboardWriteMock).toHaveBeenCalledWith({
      string: '안드로이드 복사 텍스트',
    });
  });

  it('web에서 navigator.clipboard가 있으면 writeText를 사용한다', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    await copyToClipboard('웹 복사 텍스트');

    expect(writeTextMock).toHaveBeenCalledWith('웹 복사 텍스트');
    expect(clipboardWriteMock).not.toHaveBeenCalled();
  });

  it('navigator.clipboard가 없으면 execCommand 폴백을 사용한다', async () => {
    Object.assign(navigator, { clipboard: undefined });
    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    await copyToClipboard('폴백 복사 텍스트');

    expect(execCommandMock).toHaveBeenCalledWith('copy');
  });

  it('execCommand가 실패하면 에러를 던진다', async () => {
    Object.assign(navigator, { clipboard: undefined });
    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(copyToClipboard('실패 텍스트')).rejects.toThrow(
      'execCommand copy failed',
    );
  });
});
