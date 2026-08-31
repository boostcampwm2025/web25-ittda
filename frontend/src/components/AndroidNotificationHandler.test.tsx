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

describe('네이티브 안드로이드 포그라운드 알림', () => {
  const pushListeners: Record<string, (payload: unknown) => void> = {};
  const localListeners: Record<string, (payload: unknown) => void> = {};
  const schedule = vi.fn().mockResolvedValue(undefined);
  let freshModule: typeof import('./AndroidNotificationHandler');

  beforeEach(async () => {
    vi.resetModules();
    Object.keys(pushListeners).forEach((k) => delete pushListeners[k]);
    Object.keys(localListeners).forEach((k) => delete localListeners[k]);
    schedule.mockClear();

    vi.doMock('@capacitor/push-notifications', () => ({
      PushNotifications: {
        addListener: vi.fn((event: string, cb: (payload: unknown) => void) => {
          pushListeners[event] = cb;
          return Promise.resolve({ remove: vi.fn() });
        }),
      },
    }));
    vi.doMock('@capacitor/local-notifications', () => ({
      LocalNotifications: {
        schedule,
        addListener: vi.fn((event: string, cb: (payload: unknown) => void) => {
          localListeners[event] = cb;
          return Promise.resolve({ remove: vi.fn() });
        }),
      },
    }));

    (
      window as unknown as { Capacitor: { getPlatform: () => string } }
    ).Capacitor = {
      getPlatform: () => 'android',
    };

    freshModule = await import('./AndroidNotificationHandler');
    await vi.waitFor(() =>
      expect(pushListeners.pushNotificationReceived).toBeTypeOf('function'),
    );
  });

  afterEach(() => {
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    useAuthStore.setState({ userId: null });
    vi.doUnmock('@capacitor/push-notifications');
    vi.doUnmock('@capacitor/local-notifications');
  });

  // 회귀 대상 버그: 안드로이드 FCM은 앱이 포그라운드면 notification 페이로드를
  // 시스템 트레이에 자동으로 안 띄운다 — pushNotificationReceived를 받아
  // 직접 LocalNotifications로 띄워야 웹의 포그라운드 알림과 동작이 같아진다.
  it('pushNotificationReceived를 받으면 같은 title/body로 로컬 알림을 예약한다', async () => {
    pushListeners.pushNotificationReceived({
      title: '이다 프론트',
      body: '작성자\n새 기록이 작성되었습니다.',
      data: { groupId: 'group-1', postId: 'post-1' },
    });

    await vi.waitFor(() => expect(schedule).toHaveBeenCalled());
    expect(schedule).toHaveBeenCalledWith({
      notifications: [
        expect.objectContaining({
          title: '이다 프론트',
          body: '작성자\n새 기록이 작성되었습니다.',
          extra: { groupId: 'group-1', postId: 'post-1' },
        }),
      ],
    });
  });

  it('직접 띄운 로컬 알림을 탭하면 실제 푸시를 탭했을 때와 같은 경로로 이동한다', async () => {
    // resetModules() 이후라 FreshHandler가 참조하는 useAuthStore는 파일
    // 상단에서 import한 것과 다른 모듈 인스턴스다 — 같은 그래프에서 다시
    // import해야 setState가 실제로 반영된다.
    const { useAuthStore: freshUseAuthStore } =
      await import('@/store/useAuthStore');
    freshUseAuthStore.setState({ userId: 'user-1' });
    const FreshHandler = freshModule.default;
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <FreshHandler />
      </QueryClientProvider>,
    );
    await vi.waitFor(() =>
      expect(localListeners.localNotificationActionPerformed).toBeTypeOf(
        'function',
      ),
    );

    await act(async () => {
      localListeners.localNotificationActionPerformed({
        notification: { extra: { postId: 'post-1', groupId: 'group-1' } },
      });
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/record/post-1?scope=group&groupId=group-1',
        ),
      );
    });
  });
});
