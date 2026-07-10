import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServiceGuard from './ServiceGuard';

describe('ServiceGuard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('NEXT_PUBLIC_MAINTENANCE_MODE가 true가 아니면 아무것도 렌더링하지 않는다', () => {
    vi.stubEnv('NEXT_PUBLIC_MAINTENANCE_MODE', 'false');

    const { container } = render(<ServiceGuard />);

    expect(container).toBeEmptyDOMElement();
  });

  it('NEXT_PUBLIC_MAINTENANCE_MODE가 true이면 점검 안내 오버레이를 렌더링한다', () => {
    vi.stubEnv('NEXT_PUBLIC_MAINTENANCE_MODE', 'true');

    render(<ServiceGuard />);

    expect(screen.getByText('서비스 점검 중입니다')).toBeInTheDocument();
  });
});
