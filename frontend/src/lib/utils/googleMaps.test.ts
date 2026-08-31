import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { searchPlacesByKeyword } from './googleMaps';

beforeAll(() => {
  vi.stubGlobal('google', {
    maps: {
      places: {
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
          ERROR: 'ERROR',
        },
      },
    },
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function makeService(
  respond: (
    cb: (results: unknown, status: string) => void,
  ) => void,
) {
  return {
    textSearch: (_req: unknown, cb: (results: unknown, status: string) => void) =>
      respond(cb),
  } as unknown as google.maps.places.PlacesService;
}

describe('searchPlacesByKeyword', () => {
  it('OK 상태면 결과에서 opening_hours를 제거하고 resolve한다', async () => {
    const service = makeService((cb) =>
      cb(
        [{ name: '카페', opening_hours: { open_now: true } }],
        'OK',
      ),
    );

    const results = await searchPlacesByKeyword(service, '카페');

    expect(results).toEqual([{ name: '카페' }]);
  });

  it('ZERO_RESULTS 상태면 빈 배열을 반환한다', async () => {
    const service = makeService((cb) => cb(null, 'ZERO_RESULTS'));

    await expect(searchPlacesByKeyword(service, '존재하지않는장소')).resolves.toEqual(
      [],
    );
  });

  it('그 외 상태면 에러로 reject한다', async () => {
    const service = makeService((cb) => cb(null, 'ERROR'));

    await expect(searchPlacesByKeyword(service, '오류')).rejects.toThrow(
      /Places Search failed/,
    );
  });
});
