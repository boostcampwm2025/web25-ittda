import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingCreateButton from './FloatingCreateButton';

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('FloatingCreateButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('클릭하면 기본 경로(/create/diary-travel)로 이동한다', async () => {
    render(<FloatingCreateButton />);

    await userEvent.click(
      screen.getByRole('button', { name: '새 일기/여행 기록 작성' }),
    );

    expect(mockRouter.push).toHaveBeenCalledWith('/create/diary-travel');
  });

  it('href를 지정하면 해당 경로로 이동한다', async () => {
    render(<FloatingCreateButton href="/group/1/add" />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockRouter.push).toHaveBeenCalledWith('/group/1/add');
  });
});
