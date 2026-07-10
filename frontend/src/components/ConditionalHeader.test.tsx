import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConditionalHeader from './ConditionalHeader';

const mockUsePathname = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

vi.mock('./Header', () => ({
  default: () => <div data-testid="header" />,
}));

function renderWithPathname(pathname: string) {
  mockUsePathname.mockReturnValue(pathname);
  return render(<ConditionalHeader />);
}

describe('ConditionalHeader', () => {
  it('일반 경로에서는 Header를 렌더링한다', () => {
    renderWithPathname('/');

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('로그인 관련 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/login');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('OAuth 콜백 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/oauth/callback');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('minimalPaths(예: /add)에서는 Header를 숨긴다', () => {
    renderWithPathname('/add');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('기록 상세/수정 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/record/1/edit');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('그룹 채팅 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/group/1/chat');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('/profile 정확히 일치하는 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/profile');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('/profile로 시작하지만 정확히 일치하지 않는 경로에서는 Header를 렌더링한다', () => {
    renderWithPathname('/profile/xyz');

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('지도 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/map');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('그룹 상세의 post/draft 하위 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/group/abc/post/123');

    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('admin 경로에서는 Header를 숨긴다', () => {
    renderWithPathname('/admin/users');

    expect(screen.queryByTestId('header')).toBeNull();
  });
});
