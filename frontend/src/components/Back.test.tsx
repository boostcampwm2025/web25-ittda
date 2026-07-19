import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Back from './Back';

const mockRouter = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

function stubHistoryLength(length: number) {
  Object.defineProperty(window.history, 'length', {
    configurable: true,
    value: length,
  });
}

describe('Back', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '');
  });

  afterEach(() => {
    Reflect.deleteProperty(window.history, 'length');
  });

  it('history 스택이 남아있으면 router.back으로 이동한다', async () => {
    stubHistoryLength(3);
    render(<Back />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('history 스택이 없고 fallback이 있으면 fallback으로 replace한다', async () => {
    stubHistoryLength(1);
    render(<Back fallback="/home" />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('history 스택이 없어도 fallback이 없으면 router.back으로 이동한다', async () => {
    stubHistoryLength(1);
    render(<Back />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('history 스택이 남아있으면 fallback이 있어도 back을 사용한다', async () => {
    stubHistoryLength(5);
    render(<Back fallback="/home" />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('이동 후 onClick 콜백이 호출된다', async () => {
    stubHistoryLength(3);
    const onClick = vi.fn();
    render(<Back onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('drawer placeholder history entry가 있으면 먼저 소비한 뒤 이동한다', async () => {
    stubHistoryLength(3);
    window.history.replaceState({ __drawerId: 'drawer-1' }, '');
    const goSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});

    render(<Back />);
    await userEvent.click(screen.getByRole('button'));

    // drawer placeholder를 소비하는 중이라 아직 실제 이동은 일어나지 않는다
    expect(goSpy).toHaveBeenCalledWith(-1);
    expect(mockRouter.back).not.toHaveBeenCalled();

    // 브라우저가 실제로 한 단계 되돌아간 상황을 시뮬레이션
    window.history.replaceState(null, '');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
