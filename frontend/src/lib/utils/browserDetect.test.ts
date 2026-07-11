import { describe, it, expect, afterEach, vi } from 'vitest';
import { isInAppBrowser, isPrivateMode } from './browserDetect';

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
}

describe('isInAppBrowser', () => {
  afterEach(() => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    );
  });

  it('카카오톡 인앱 브라우저 UA면 true를 반환한다', () => {
    setUserAgent('Mozilla/5.0 ... KAKAOTALK 10.0');
    expect(isInAppBrowser()).toBe(true);
  });

  it('인스타그램 인앱 브라우저 UA면 true를 반환한다', () => {
    setUserAgent('Mozilla/5.0 ... Instagram 123.0');
    expect(isInAppBrowser()).toBe(true);
  });

  it('일반 브라우저 UA면 false를 반환한다', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    );
    expect(isInAppBrowser()).toBe(false);
  });
});

describe('isPrivateMode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('storage.estimate의 quota가 충분히 크면 false를 반환한다', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      storage: {
        estimate: vi.fn().mockResolvedValue({ quota: 500_000_000 }),
      },
    });

    await expect(isPrivateMode()).resolves.toBe(false);
    vi.unstubAllGlobals();
  });

  it('storage.estimate의 quota가 매우 작으면 true를 반환한다(시크릿 모드 추정)', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      storage: {
        estimate: vi.fn().mockResolvedValue({ quota: 1000 }),
      },
    });

    await expect(isPrivateMode()).resolves.toBe(true);
    vi.unstubAllGlobals();
  });
});
