import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ServiceWorkerUpdater from './ServiceWorkerUpdater';

function mockRegistration() {
  return { update: vi.fn().mockResolvedValue(undefined) };
}

function setupServiceWorker(registrations: ReturnType<typeof mockRegistration>[]) {
  const listeners: Record<string, (() => void)[]> = {};
  const serviceWorker = {
    getRegistrations: vi.fn().mockResolvedValue(registrations),
    addEventListener: vi.fn((event: string, handler: () => void) => {
      (listeners[event] ??= []).push(handler);
    }),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    value: serviceWorker,
    configurable: true,
  });
  return { serviceWorker, fire: (event: string) => listeners[event]?.forEach((h) => h()) };
}

describe('ServiceWorkerUpdater', () => {
  const reloadMock = vi.fn();

  beforeEach(() => {
    reloadMock.mockClear();
    vi.stubGlobal('location', { ...window.location, reload: reloadMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'serviceWorker');
    vi.useRealTimers();
  });

  it('마운트 시 등록된 모든 서비스워커에 update()를 호출한다', async () => {
    const reg1 = mockRegistration();
    const reg2 = mockRegistration();
    const { serviceWorker } = setupServiceWorker([reg1, reg2]);

    render(<ServiceWorkerUpdater />);
    await vi.waitFor(() => expect(serviceWorker.getRegistrations).toHaveBeenCalled());
    await vi.waitFor(() => expect(reg1.update).toHaveBeenCalled());
    expect(reg2.update).toHaveBeenCalled();
  });

  it('탭이 다시 보이면(visibilitychange) 갱신을 다시 확인한다', async () => {
    const reg = mockRegistration();
    const { serviceWorker } = setupServiceWorker([reg]);

    render(<ServiceWorkerUpdater />);
    await vi.waitFor(() => expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() =>
      expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(2),
    );
  });

  it('controllerchange 발생 시 페이지를 한 번만 새로고침한다', async () => {
    const { fire } = setupServiceWorker([mockRegistration()]);
    render(<ServiceWorkerUpdater />);

    fire('controllerchange');
    fire('controllerchange');

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
