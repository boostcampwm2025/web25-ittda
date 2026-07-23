import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseMediaResolveSingle = vi.hoisted(() => vi.fn());
const mockToastInfo = vi.hoisted(() => vi.fn());

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerClose: ({ children }: { children: React.ReactNode }) => (
    <button aria-label="닫기">{children}</button>
  ),
}));

vi.mock('react-share', () => {
  const Button = ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  );
  const Icon = () => <span />;
  return {
    EmailShareButton: Button,
    EmailIcon: Icon,
    FacebookIcon: Icon,
    FacebookShareButton: Button,
    FacebookMessengerShareButton: Button,
    FacebookMessengerIcon: Icon,
    LineShareButton: Button,
    LineIcon: Icon,
    XIcon: Icon,
    TwitterShareButton: Button,
  };
});

vi.mock('@/hooks/useMediaResolve', () => ({
  useMediaResolveSingle: mockUseMediaResolveSingle,
}));

vi.mock('sonner', () => ({
  toast: { info: mockToastInfo },
}));

const record = {
  id: 'record-1',
  title: '성수동 카페 투어',
  image: null,
  content: '오늘의 기록 내용',
};

function baseProps() {
  return {
    title: '성수동 카페 투어',
    path: 'https://itda.app/record/record-1',
    open: true,
    onOpenChange: vi.fn(),
    record,
  };
}

describe('SocialShareDrawer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockUseMediaResolveSingle.mockReturnValue({ data: undefined });
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    delete (window as unknown as { Kakao?: unknown }).Kakao;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    delete (window as unknown as { Kakao?: unknown }).Kakao;
  });

  it('navigator.share가 없고 네이티브 환경도 아니면 시스템 공유 버튼을 숨긴다', async () => {
    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    expect(
      screen.queryByRole('button', { name: /더 많은 앱으로 공유/ }),
    ).toBeNull();
  });

  it('navigator.share가 있으면 시스템 공유 버튼을 보여준다', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn(),
    });
    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    expect(
      screen.getByRole('button', { name: /더 많은 앱으로 공유/ }),
    ).toBeInTheDocument();
  });

  it('링크 복사에 성공하면 복사됨으로 바뀌었다가 2초 후 되돌아온다', async () => {
    vi.doMock('@/lib/utils/clipboard', () => ({
      copyToClipboard: vi.fn().mockResolvedValue(undefined),
    }));
    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    await userEvent.click(screen.getByRole('button', { name: '복사' }));

    expect(await screen.findByText('복사됨')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByText('복사')).toBeInTheDocument(),
      { timeout: 2500 },
    );
  }, 3000);

  it('클립보드 복사가 실패하면 안내 토스트를 표시한다', async () => {
    vi.doMock('@/lib/utils/clipboard', () => {
      throw new Error('클립보드 미지원');
    });
    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    await userEvent.click(screen.getByRole('button', { name: '복사' }));

    await waitFor(() =>
      expect(mockToastInfo).toHaveBeenCalledWith(
        '클립보드를 지원하지 않는 환경입니다.',
      ),
    );
  });

  it('네이티브 환경이면 Capacitor Share 플러그인으로 공유한다', async () => {
    window.Capacitor = { isNativePlatform: () => true };
    const share = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@capacitor/share', () => ({ Share: { share } }));

    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    await userEvent.click(
      screen.getByRole('button', { name: /더 많은 앱으로 공유/ }),
    );

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: '성수동 카페 투어',
        text: '오늘의 기록 내용',
        url: 'https://itda.app/record/record-1',
      }),
    );
  });

  it('네이티브가 아니고 navigator.share가 있으면 navigator.share를 호출한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    });
    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    await userEvent.click(
      screen.getByRole('button', { name: /더 많은 앱으로 공유/ }),
    );

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: '성수동 카페 투어',
        text: '오늘의 기록 내용',
        url: 'https://itda.app/record/record-1',
      }),
    );
  });

  it('네이티브 환경이면 window.Kakao가 있어도 카카오 공유 버튼을 노출하지 않는다', async () => {
    window.Capacitor = { isNativePlatform: () => true };
    window.Kakao = { Share: { sendDefault: vi.fn() } };

    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    expect(
      screen.queryByRole('button', { name: '카카오톡으로 공유하기' }),
    ).toBeNull();
  });

  it('window.Kakao가 없으면 카카오 공유 버튼을 노출하지 않는다', async () => {
    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    expect(
      screen.queryByRole('button', { name: '카카오톡으로 공유하기' }),
    ).toBeNull();
  });

  it('카카오 SDK가 있으면 sendDefault를 올바른 payload로 호출한다', async () => {
    const sendDefault = vi.fn();
    window.Kakao = { Share: { sendDefault } };
    const { default: SocialShareDrawer } = await import('./SocialShareDrawer');
    render(<SocialShareDrawer {...baseProps()} />);

    await userEvent.click(
      screen.getByRole('button', { name: '카카오톡으로 공유하기' }),
    );

    expect(sendDefault).toHaveBeenCalledWith(
      expect.objectContaining({
        objectType: 'feed',
        content: expect.objectContaining({
          title: '성수동 카페 투어',
          description: '오늘의 기록 내용',
        }),
      }),
    );
  });
});
