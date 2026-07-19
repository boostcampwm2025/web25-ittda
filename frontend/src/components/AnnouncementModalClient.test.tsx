import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnouncementModalClient from './AnnouncementModalClient';

const mockRouter = vi.hoisted(() => ({ refresh: vi.fn() }));
const mockUseAuthStore = vi.hoisted(() => vi.fn());
const mockMutate = vi.hoisted(() => vi.fn());
const mockSetCookie = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('@/hooks/useApi', () => ({
  useApiPatch: () => ({ mutate: mockMutate }),
}));

vi.mock('@/lib/utils/cookie', () => ({
  setCookie: mockSetCookie,
}));

vi.mock('@/components/AssetImage', () => ({
  default: ({ alt }: { alt: string }) => <img data-testid="asset-image" alt={alt} />,
}));

const announcement = {
  id: 'announce-1',
  title: '새로운 기능 안내',
  content: '지도 기능이 추가되었어요',
  imageUrl: 'img-1',
};

describe('AnnouncementModalClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제목, 내용, 이미지를 렌더링한다', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ userId: null }),
    );
    render(<AnnouncementModalClient announcement={announcement} />);

    expect(screen.getByText('새로운 기능 안내')).toBeInTheDocument();
    expect(screen.getByText('지도 기능이 추가되었어요')).toBeInTheDocument();
    expect(screen.getByTestId('asset-image')).toBeInTheDocument();
  });

  it('로그인 유저가 닫으면 설정 API를 호출하고 성공 시 새로고침한다', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ userId: 'user-1' }),
    );
    render(<AnnouncementModalClient announcement={announcement} />);

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(mockMutate).toHaveBeenCalledWith(
      { settings: { dismissedAnnouncementId: 'announce-1' } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockSetCookie).not.toHaveBeenCalled();

    // mutate의 onSuccess 콜백을 직접 실행해 새로고침 동작을 검증
    const onSuccess = mockMutate.mock.calls[0][1].onSuccess;
    onSuccess();
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
  });

  it('게스트가 닫으면 쿠키를 저장하고 바로 새로고침한다', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ userId: null }),
    );
    render(<AnnouncementModalClient announcement={announcement} />);

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(mockSetCookie).toHaveBeenCalledWith(
      'dismissed-announcement-id',
      'announce-1',
      { days: 30 },
    );
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
  });

  it('닫기(X) 버튼을 클릭해도 동일하게 닫힌다', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ userId: null }),
    );
    render(<AnnouncementModalClient announcement={announcement} />);

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(mockSetCookie).toHaveBeenCalled();
  });

  it('모달 카드 내부 클릭은 닫기 동작으로 이어지지 않는다', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ userId: null }),
    );
    render(<AnnouncementModalClient announcement={announcement} />);

    await userEvent.click(screen.getByText('새로운 기능 안내'));

    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });
});
