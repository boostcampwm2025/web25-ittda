import {
  decodeMonthCursor,
  encodeMonthCursor,
  paginateMonthKeys,
} from './month-cursor';

describe('month-cursor', () => {
  it('encodes and decodes month keys', () => {
    const cursor = encodeMonthCursor('2026-06');

    expect(decodeMonthCursor(cursor)).toBe('2026-06');
  });

  it('ignores invalid cursors', () => {
    expect(decodeMonthCursor('invalid-cursor')).toBeNull();
  });

  it('paginates from the first item when cursor is missing', () => {
    const result = paginateMonthKeys(
      ['2026-06', '2026-05', '2026-04'],
      null,
      2,
    );

    expect(result.items).toEqual(['2026-06', '2026-05']);
    expect(decodeMonthCursor(result.nextCursor)).toBe('2026-05');
  });

  it('continues after the cursor month', () => {
    const cursor = encodeMonthCursor('2026-05');
    const result = paginateMonthKeys(
      ['2026-06', '2026-05', '2026-04'],
      cursor,
      2,
    );

    expect(result.items).toEqual(['2026-04']);
    expect(result.nextCursor).toBeNull();
  });
});
