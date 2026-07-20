import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import AndroidNotificationHandler, {
  handleNotificationAction,
  extractPostId,
} from './AndroidNotificationHandler';

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/lib/api/records', () => ({
  recordDetailOptions: (recordId: string) => ({
    queryKey: ['record', recordId],
    queryFn: () => Promise.resolve(null),
  }),
}));

function renderWithClient() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AndroidNotificationHandler />
    </QueryClientProvider>,
  );
}

describe('extractPostId', () => {
  it('/record/:id 형태의 경로에서 id를 추출한다', () => {
    expect(extractPostId('/record/post-1')).toBe('post-1');
  });

  it('쿼리스트링이 있어도 id만 추출한다', () => {
    expect(extractPostId('/record/post-1?scope=group&groupId=group-1')).toBe(
      'post-1',
    );
  });

  it('/record/ 경로가 아니면 null을 반환한다', () => {
    expect(extractPostId('/group/group-1')).toBeNull();
  });
});

describe('handleNotificationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ userId: 'user-1' });
  });

  afterEach(() => {
    useAuthStore.setState({ userId: null });
  });

  it('postId와 groupId가 모두 있으면 그룹 스코프 기록 경로로 이동한다', async () => {
    renderWithClient();

    await act(async () => {
      handleNotificationAction({ postId: 'post-1', groupId: 'group-1' });
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/record/post-1?scope=group&groupId=group-1',
        ),
      );
    });
  });

  it('postId만 있으면 기록 경로로 이동한다', async () => {
    renderWithClient();

    await act(async () => {
      handleNotificationAction({ postId: 'post-1' });
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith('/record/post-1'),
      );
    });
  });

  it('groupId만 있으면 그룹 경로로 이동한다', async () => {
    renderWithClient();

    await act(async () => {
      handleNotificationAction({ groupId: 'group-1' });
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith('/group/group-1'),
      );
    });
  });

  it('postId와 groupId가 모두 없으면 이동하지 않는다', async () => {
    renderWithClient();

    await act(async () => {
      handleNotificationAction({});
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
