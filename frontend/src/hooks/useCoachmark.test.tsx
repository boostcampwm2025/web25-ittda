import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockUseAuthStore = vi.hoisted(() => vi.fn());
const getMock = vi.hoisted(() => vi.fn());
const patchMock = vi.hoisted(() => vi.fn());

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('@/lib/api/api', () => ({
  get: (...args: unknown[]) => getMock(...args),
  patch: (...args: unknown[]) => patchMock(...args),
}));

import { useCoachmark, type CoachmarkStep } from './useCoachmark';

const STEPS: CoachmarkStep[] = [
  { id: 'step-1', title: '스텝 1', description: '설명 1' },
  { id: 'step-2', title: '스텝 2', description: '설명 2' },
];

function setup({
  userType = null as 'social' | 'guest' | null,
  // 로그아웃 없이 게스트로 전환된 경우 등, userType과 무관하게 스토어에
  // 남아있을 수 있는 값을 시뮬레이션하기 위해 userId는 별도로 받는다.
  userId = (userType === 'social' ? 'user-1' : null) as string | null,
  seenCoachmarks = [] as string[],
} = {}) {
  mockUseAuthStore.mockImplementation((selector) =>
    selector({ userId, userType }),
  );
  getMock.mockResolvedValue({
    success: true,
    data: {
      userId: userId ?? 'guest',
      user: { settings: { seenCoachmarks } },
    },
  });
  patchMock.mockResolvedValue({ success: true, data: {} });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

function addTarget(id: string) {
  const el = document.createElement('button');
  el.setAttribute('data-tutorial-id', id);
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('useCoachmark', () => {
  it('게스트(userId 없음)는 타겟이 있어도 활성화되지 않는다', async () => {
    setup({ userType: null });
    addTarget('step-1');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(getMock).not.toHaveBeenCalled());
    expect(result.current.isActive).toBe(false);
    expect(result.current.rect).toBeNull();
  });

  // 회귀 테스트: logout() 없이 게스트로 전환되면 스토어에 예전 소셜 로그인의
  // userId가 남아있을 수 있다. userId만으로 판단하면 이 경우 게스트인데도
  // 로그인 사용자로 착각해 코치마크가 뜬다 — userType으로 판단해야 한다.
  it('userType이 게스트면 userId가 남아있어도(로그아웃 없이 전환된 경우) 활성화되지 않는다', async () => {
    setup({ userType: 'guest', userId: 'stale-user-id' });
    addTarget('step-1');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(getMock).not.toHaveBeenCalled());
    expect(result.current.isActive).toBe(false);
    expect(result.current.rect).toBeNull();
  });

  it('flowKey가 seenCoachmarks에 이미 있으면 활성화되지 않는다', async () => {
    setup({ userType: 'social', seenCoachmarks: ['home'] });
    addTarget('step-1');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isActive).toBe(false));
  });

  it('로그인 유저이고 안 본 flowKey면 타겟을 찾아 활성화된다', async () => {
    setup({ userType: 'social', seenCoachmarks: [] });
    addTarget('step-1');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isActive).toBe(true));
    await waitFor(() => expect(result.current.rect).not.toBeNull());
    expect(result.current.step?.id).toBe('step-1');
  });

  it('공지 모달(data-announcement-modal)이 떠 있으면 활성화되지 않고, 닫히면 활성화된다', async () => {
    setup({ userType: 'social' });
    addTarget('step-1');
    const modal = document.createElement('div');
    modal.setAttribute('data-announcement-modal', '');
    document.body.appendChild(modal);

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(result.current.isActive).toBe(false);

    act(() => {
      modal.remove();
    });

    await waitFor(() => expect(result.current.isActive).toBe(true));
  });

  it('PWA 배너 표시 여부 체크가 진행 중이면(data-pwa-banner-pending) 활성화되지 않고, 끝나면 활성화된다', async () => {
    setup({ userType: 'social' });
    addTarget('step-1');
    const pendingMarker = document.createElement('div');
    pendingMarker.setAttribute('data-pwa-banner-pending', '');
    document.body.appendChild(pendingMarker);

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(result.current.isActive).toBe(false);

    act(() => {
      pendingMarker.remove();
    });

    await waitFor(() => expect(result.current.isActive).toBe(true));
  });

  it('nextStep은 마지막 스텝이 아니면 다음 스텝으로 넘어간다', async () => {
    setup({ userType: 'social' });
    addTarget('step-1');
    addTarget('step-2');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isActive).toBe(true));
    expect(result.current.step?.id).toBe('step-1');
    expect(result.current.isLastStep).toBe(false);

    act(() => {
      result.current.nextStep();
    });

    await waitFor(() => expect(result.current.step?.id).toBe('step-2'));
    expect(result.current.isLastStep).toBe(true);
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('마지막 스텝에서 nextStep을 부르면 완료 처리되고, 로그인 유저는 seenCoachmarks에 flowKey를 합쳐서 저장한다', async () => {
    setup({ userType: 'social', seenCoachmarks: ['shared'] });
    addTarget('step-1');
    addTarget('step-2');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isActive).toBe(true));

    act(() => {
      result.current.nextStep();
    });
    await waitFor(() => expect(result.current.step?.id).toBe('step-2'));

    act(() => {
      result.current.nextStep();
    });

    await waitFor(() => expect(result.current.isActive).toBe(false));
    expect(patchMock).toHaveBeenCalledWith('/api/me/settings', {
      settings: { seenCoachmarks: ['shared', 'home'] },
    });
  });

  it('skip을 호출하면 완료 처리되고 저장된다', async () => {
    setup({ userType: 'social' });
    addTarget('step-1');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'shared', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isActive).toBe(true));

    act(() => {
      result.current.skip();
    });

    await waitFor(() => expect(result.current.isActive).toBe(false));
    expect(patchMock).toHaveBeenCalledWith('/api/me/settings', {
      settings: { seenCoachmarks: ['shared'] },
    });
  });

  it('게스트가 finish를 호출하면(스킵/마지막 확인) 설정 API를 호출하지 않는다', async () => {
    setup({ userType: null });

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'home', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.skip();
    });

    expect(patchMock).not.toHaveBeenCalled();
  });

  it('타겟을 계속 못 찾으면 타임아웃 후 자동으로 다음 스텝으로 넘어간다', async () => {
    vi.useFakeTimers();
    setup({ userType: 'social' });
    // step-1의 타겟은 DOM에 없음(예: 롤 제약으로 렌더되지 않는 버튼)
    addTarget('step-2');

    const { result } = renderHook(
      () => useCoachmark({ flowKey: 'group-detail', steps: STEPS }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.step?.id).toBe('step-1');
    expect(result.current.rect).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(result.current.step?.id).toBe('step-2');
  });
});
