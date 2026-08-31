import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation, reverseGeocodeAddress } from './useGeolocation';

const captureExceptionMock = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

function stubGeolocation(
  impl: (
    success: PositionCallback,
    error?: PositionErrorCallback,
  ) => void,
) {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: vi.fn(impl) },
    configurable: true,
  });
}

beforeAll(() => {
  vi.stubGlobal('google', {
    maps: {
      Geocoder: class {
        geocode(
          _req: unknown,
          cb: (results: unknown, status: string) => void,
        ) {
          cb(
            [
              {
                address_components: [
                  { types: ['locality'], long_name: '서울특별시' },
                  { types: ['sublocality_level_2'], long_name: '강남구' },
                ],
                formatted_address: '서울특별시 강남구 전체 주소',
              },
            ],
            'OK',
          );
        }
      },
    },
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.restoreAllMocks();
  captureExceptionMock.mockClear();
  Object.defineProperty(navigator, 'geolocation', {
    value: undefined,
    configurable: true,
  });
});

describe('useGeolocation', () => {
  it('geolocation API를 지원하지 않으면 에러 상태로 종료한다', async () => {
    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('브라우저가 위치 정보를 지원하지 않습니다.');
  });

  it('위치 조회에 성공하고 역지오코딩도 성공하면 address까지 채워진다', async () => {
    stubGeolocation((success) => {
      success({
        coords: { latitude: 37.5, longitude: 127.0 },
      } as GeolocationPosition);
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.latitude).toBe(37.5);
    expect(result.current.address).toBe('서울특별시 강남구');
  });

  it('reverseGeocode: false면 역지오코딩 없이 좌표만 반환한다', async () => {
    stubGeolocation((success) => {
      success({
        coords: { latitude: 10, longitude: 20 },
      } as GeolocationPosition);
    });

    const { result } = renderHook(() =>
      useGeolocation({ reverseGeocode: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.latitude).toBe(10);
    expect(result.current.address).toBeNull();
  });

  it('PERMISSION_DENIED면 권한 거부 메시지를 반환한다', async () => {
    stubGeolocation((_success, error) => {
      error?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError);
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('위치 권한이 거부되었습니다.');
  });

  it('TIMEOUT이면 시간 초과 메시지를 반환한다', async () => {
    stubGeolocation((_success, error) => {
      error?.({ code: 3, TIMEOUT: 3 } as GeolocationPositionError);
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('위치 정보 요청 시간이 초과되었습니다.');
  });
});

describe('reverseGeocodeAddress', () => {
  it('geocode 성공 시 시/동을 조합한 주소를 반환한다', async () => {
    await expect(reverseGeocodeAddress(37.5, 127.0)).resolves.toBe(
      '서울특별시 강남구',
    );
  });
});
