import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RetryFallback from './RetryFallback';

const mockRouter = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('./Back', () => ({
  default: ({ fallback }: { fallback: string }) => (
    <button data-testid="back" data-fallback={fallback} />
  ),
}));

describe('RetryFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fallback을 전달하지 않으면 Back 버튼을 렌더링하지 않는다', () => {
    render(<RetryFallback />);

    expect(screen.queryByTestId('back')).toBeNull();
  });

  it('fallback을 전달하면 해당 경로로 Back 버튼을 렌더링한다', () => {
    render(<RetryFallback fallback="/home" />);

    expect(screen.getByTestId('back')).toHaveAttribute(
      'data-fallback',
      '/home',
    );
  });

  it('재시도 버튼을 클릭하면 router.refresh가 호출된다', async () => {
    render(<RetryFallback />);

    await userEvent.click(screen.getByRole('button', { name: /재시도/ }));

    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
  });
});
