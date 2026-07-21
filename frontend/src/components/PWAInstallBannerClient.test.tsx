import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PWAInstallBannerClient from './PWAInstallBannerClient';

const mockUsePathname = vi.hoisted(() => vi.fn());
const mockUsePWAInstall = vi.hoisted(() => vi.fn());
const mockIsPrivateMode = vi.hoisted(() => vi.fn());
const mockUseAuthStore = vi.hoisted(() => vi.fn());
const mockSetCookie = vi.hoisted(() => vi.fn());
const mockUpdateSettings = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: mockUsePWAInstall,
}));

vi.mock('@/lib/utils/browserDetect', () => ({
  isPrivateMode: mockIsPrivateMode,
}));

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('@/lib/utils/cookie', () => ({
  setCookie: mockSetCookie,
}));

vi.mock('@/hooks/useApi', () => ({
  useApiPatch: () => ({ mutate: mockUpdateSettings }),
}));

vi.mock('./PWAInstallModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="install-modal" /> : null,
}));

function setup({
  promptInstall = vi.fn(),
  isInstalled = false,
  isCheckComplete = true,
  pathname = '/',
  isPrivate = false,
  userId = null as string | null,
} = {}) {
  mockUsePathname.mockReturnValue(pathname);
  mockUsePWAInstall.mockReturnValue({
    isInstalled,
    isCheckComplete,
    promptInstall,
    isIOS: false,
    isSafari: false,
    isMacOS: false,
  });
  mockIsPrivateMode.mockResolvedValue(isPrivate);
  mockUseAuthStore.mockImplementation((selector) => selector({ userId }));
  return { promptInstall };
}

describe('PWAInstallBannerClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isCheckComplete가 false면 배너 대신 대기 마커만 렌더링한다', async () => {
    setup({ isCheckComplete: false });
    render(<PWAInstallBannerClient />);

    await waitFor(() => expect(mockIsPrivateMode).toHaveBeenCalled());
    // 체크 진행 중에는 실제 배너 콘텐츠가 없어야 하지만,
    // 코치마크가 감지할 수 있는 대기 마커는 DOM에 남아있어야 한다.
    expect(
      screen.queryByText('잇다- 앱으로 설치하기'),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-pwa-banner-pending]')).not.toBeNull();
  });

  it('이미 설치되어 있으면 렌더링하지 않는다', async () => {
    setup({ isInstalled: true });
    const { container } = render(<PWAInstallBannerClient />);

    await waitFor(() => expect(mockIsPrivateMode).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('시크릿 모드면 렌더링하지 않는다', async () => {
    setup({ isPrivate: true });
    const { container } = render(<PWAInstallBannerClient />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it.each(['/login', '/oauth/callback'])(
    '%s 경로에서는 렌더링하지 않는다',
    async (pathname) => {
      setup({ pathname });
      const { container } = render(<PWAInstallBannerClient />);

      await waitFor(() => expect(mockIsPrivateMode).toHaveBeenCalled());
      expect(container).toBeEmptyDOMElement();
    },
  );

  it('정상 조건이면 배너를 렌더링한다', async () => {
    setup();
    render(<PWAInstallBannerClient />);

    expect(
      await screen.findByText('잇다- 앱으로 설치하기'),
    ).toBeInTheDocument();
  });

  it('설치 프롬프트가 accepted면 배너를 닫는다', async () => {
    const { promptInstall } = setup({
      promptInstall: vi.fn().mockResolvedValue('accepted'),
    });
    render(<PWAInstallBannerClient />);
    const banner = await screen.findByText('잇다- 앱으로 설치하기');

    await userEvent.click(banner);

    expect(promptInstall).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('잇다- 앱으로 설치하기')).toBeNull(),
    );
  });

  it('설치 프롬프트가 null(미지원 브라우저)이면 안내 모달을 연다', async () => {
    setup({ promptInstall: vi.fn().mockResolvedValue(null) });
    render(<PWAInstallBannerClient />);
    const banner = await screen.findByText('잇다- 앱으로 설치하기');

    await userEvent.click(banner);

    expect(await screen.findByTestId('install-modal')).toBeInTheDocument();
  });

  it('설치 프롬프트가 dismissed면 배너를 닫는다', async () => {
    setup({ promptInstall: vi.fn().mockResolvedValue('dismissed') });
    render(<PWAInstallBannerClient />);
    const banner = await screen.findByText('잇다- 앱으로 설치하기');

    await userEvent.click(banner);

    await waitFor(() =>
      expect(screen.queryByText('잇다- 앱으로 설치하기')).toBeNull(),
    );
  });

  it('닫기 버튼 클릭 시 로그인 유저는 설정 API로 dismissedUntil을 저장하고, 설치 프롬프트는 실행되지 않는다', async () => {
    const { promptInstall } = setup({ userId: 'user-1' });
    render(<PWAInstallBannerClient />);
    await screen.findByText('잇다- 앱으로 설치하기');

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      settings: { pwaBannerDismissedUntil: expect.any(Number) },
    });
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(promptInstall).not.toHaveBeenCalled();
  });

  it('닫기 버튼 클릭 시 게스트는 쿠키에 dismissedUntil을 저장한다', async () => {
    setup({ userId: null });
    render(<PWAInstallBannerClient />);
    await screen.findByText('잇다- 앱으로 설치하기');

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(mockSetCookie).toHaveBeenCalledWith(
      'pwa-banner-dismissed-until',
      expect.any(String),
      { days: 14 },
    );
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it('"다시 보지 않기" 클릭 시 로그인 유저는 설정 API로 저장한다', async () => {
    setup({ userId: 'user-1' });
    render(<PWAInstallBannerClient />);

    await userEvent.click(
      await screen.findByRole('button', { name: '다시 보지 않기' }),
    );

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      settings: { pwaBannerNeverShow: true },
    });
  });

  it('"다시 보지 않기" 클릭 시 게스트는 쿠키에 영구 저장한다', async () => {
    setup({ userId: null });
    render(<PWAInstallBannerClient />);

    await userEvent.click(
      await screen.findByRole('button', { name: '다시 보지 않기' }),
    );

    expect(mockSetCookie).toHaveBeenCalledWith(
      'pwa-banner-never-show',
      'true',
      { days: 3650 },
    );
  });
});
