import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ServiceWorkerUpdater from './ServiceWorkerUpdater';

function mockRegistration() {
  return { update: vi.fn().mockResolvedValue(undefined) };
}

function setupServiceWorker(
  registrations: ReturnType<typeof mockRegistration>[],
) {
  const serviceWorker = {
    getRegistrations: vi.fn().mockResolvedValue(registrations),
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    value: serviceWorker,
    configurable: true,
  });
  return { serviceWorker };
}

describe('ServiceWorkerUpdater', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    vi.useRealTimers();
  });

  it('마운트 시 등록된 모든 서비스워커에 update()를 호출한다', async () => {
    const reg1 = mockRegistration();
    const reg2 = mockRegistration();
    const { serviceWorker } = setupServiceWorker([reg1, reg2]);

    render(<ServiceWorkerUpdater />);
    await vi.waitFor(() =>
      expect(serviceWorker.getRegistrations).toHaveBeenCalled(),
    );
    await vi.waitFor(() => expect(reg1.update).toHaveBeenCalled());
    expect(reg2.update).toHaveBeenCalled();
  });

  it('탭이 다시 보이면(visibilitychange) 갱신을 다시 확인한다', async () => {
    const reg = mockRegistration();
    const { serviceWorker } = setupServiceWorker([reg]);

    render(<ServiceWorkerUpdater />);
    await vi.waitFor(() =>
      expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(1),
    );

    const visibilitySpy = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() =>
      expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(2),
    );

    visibilitySpy.mockRestore();
  });
});
