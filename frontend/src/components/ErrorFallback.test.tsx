import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorFallback from './ErrorFallback';

describe('ErrorFallback', () => {
  it('안내 메시지와 다시 시도 버튼을 렌더링한다', () => {
    render(
      <ErrorFallback error={new Error('실패')} resetErrorBoundary={vi.fn()} />,
    );

    expect(screen.getByText('잠시 후 다시 시도해주세요.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });

  it('다시 시도 버튼을 클릭하면 resetErrorBoundary가 호출된다', async () => {
    const resetErrorBoundary = vi.fn();
    render(
      <ErrorFallback
        error={new Error('실패')}
        resetErrorBoundary={resetErrorBoundary}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });
});
