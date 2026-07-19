import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import SocketManager from './SocketManager';

const mockUseSocketStore = vi.hoisted(() => vi.fn());

vi.mock('@/store/useSocketStore', () => ({
  useSocketStore: mockUseSocketStore,
}));

describe('SocketManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('마운트되면 connectSocket을 호출한다', () => {
    const connectSocket = vi.fn();
    mockUseSocketStore.mockReturnValue({ connectSocket, socket: null });

    render(<SocketManager />);

    expect(connectSocket).toHaveBeenCalledTimes(1);
  });

  it('socket이 연결되어 있으면 재연결 타이머를 걸지 않는다', () => {
    const connectSocket = vi.fn();
    mockUseSocketStore.mockReturnValue({
      connectSocket,
      socket: { id: 'socket-1' },
    });

    render(<SocketManager />);
    connectSocket.mockClear();

    vi.advanceTimersByTime(2000);

    expect(connectSocket).not.toHaveBeenCalled();
  });

  it('socket이 null이면 2초 뒤 재연결을 시도한다', () => {
    const connectSocket = vi.fn();
    mockUseSocketStore.mockReturnValue({ connectSocket, socket: null });

    render(<SocketManager />);
    connectSocket.mockClear();

    vi.advanceTimersByTime(1999);
    expect(connectSocket).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(connectSocket).toHaveBeenCalledTimes(1);
  });
});
