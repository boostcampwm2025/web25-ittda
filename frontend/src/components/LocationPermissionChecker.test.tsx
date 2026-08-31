import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LocationPermissionChecker from './LocationPermissionChecker';

const mockUseLocationPermissionStore = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock('@/store/useLocationPermissionStore', () => ({
  useLocationPermissionStore: mockUseLocationPermissionStore,
}));

vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}));

vi.mock('./LocationPermissionModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <button data-testid="permission-modal" onClick={onClose} />
    ) : null,
}));

describe('LocationPermissionChecker', () => {
  const checkPermission = vi.fn();
  const canShowToast = vi.fn();
  const setLastToastShownAt = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupStore(overrides: { hasAskedPermission?: boolean } = {}) {
    mockUseLocationPermissionStore.mockReturnValue({
      hasAskedPermission: overrides.hasAskedPermission ?? false,
      checkPermission,
      canShowToast,
      setLastToastShownAt,
    });
  }

  it('권한이 granted면 모달도 토스트도 표시하지 않는다', async () => {
    setupStore();
    checkPermission.mockResolvedValue('granted');

    render(<LocationPermissionChecker />);
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(screen.queryByTestId('permission-modal')).toBeNull();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('권한이 denied이고 24시간이 지났으면 토스트를 표시한다', async () => {
    setupStore();
    checkPermission.mockResolvedValue('denied');
    canShowToast.mockReturnValue(true);

    render(<LocationPermissionChecker />);
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(mockToastError).toHaveBeenCalledWith(
      '위치 권한이 필요해요',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(setLastToastShownAt).toHaveBeenCalled();
    expect(screen.queryByTestId('permission-modal')).toBeNull();
  });

  it('권한이 denied이지만 24시간이 지나지 않았으면 토스트를 표시하지 않는다', async () => {
    setupStore();
    checkPermission.mockResolvedValue('denied');
    canShowToast.mockReturnValue(false);

    render(<LocationPermissionChecker />);
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('prompt 상태이고 아직 물어본 적 없으면 권한 요청 모달을 표시한다', async () => {
    setupStore({ hasAskedPermission: false });
    checkPermission.mockResolvedValue('prompt');

    render(<LocationPermissionChecker />);
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(screen.getByTestId('permission-modal')).toBeInTheDocument();
  });

  it('이미 모달을 통해 물어본 적이 있으면 다시 표시하지 않는다', async () => {
    setupStore({ hasAskedPermission: true });
    checkPermission.mockResolvedValue('prompt');

    render(<LocationPermissionChecker />);
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(screen.queryByTestId('permission-modal')).toBeNull();
  });

  it('모달의 onClose가 호출되면 모달이 사라진다', async () => {
    setupStore({ hasAskedPermission: false });
    checkPermission.mockResolvedValue('prompt');

    render(<LocationPermissionChecker />);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByTestId('permission-modal')).toBeInTheDocument();

    act(() => {
      screen.getByTestId('permission-modal').click();
    });

    expect(screen.queryByTestId('permission-modal')).toBeNull();
  });
});
