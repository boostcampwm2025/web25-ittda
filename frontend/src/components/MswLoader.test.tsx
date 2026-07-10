import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

describe('MswLoader', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('NEXT_PUBLIC_MOCK이 true가 아니면 worker를 시작하지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK', 'false');
    const start = vi.fn();
    vi.doMock('@/_lib/mocks/browser', () => ({ worker: { start } }));

    const { default: MswLoader } = await import('./MswLoader');
    render(<MswLoader />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(start).not.toHaveBeenCalled();
  });

  it('NEXT_PUBLIC_MOCK이 true이면 MSW worker를 시작한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK', 'true');
    const start = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@/_lib/mocks/browser', () => ({ worker: { start } }));

    const { default: MswLoader } = await import('./MswLoader');
    render(<MswLoader />);

    await waitFor(() =>
      expect(start).toHaveBeenCalledWith({ onUnhandledRequest: 'bypass' }),
    );
  });
});
