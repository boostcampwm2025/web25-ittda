const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

export function encodeMonthCursor(monthKey: string): string {
  return Buffer.from(monthKey, 'utf-8').toString('base64');
}

export function decodeMonthCursor(cursor?: string | null): string | null {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return MONTH_KEY_RE.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export function paginateMonthKeys(
  monthKeys: string[],
  cursor?: string | null,
  limit: number = 12,
) {
  const decodedCursor = decodeMonthCursor(cursor);
  const cursorIndex = decodedCursor ? monthKeys.indexOf(decodedCursor) : -1;
  const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  const items = monthKeys.slice(startIndex, startIndex + limit);
  const hasNext = startIndex + limit < monthKeys.length;
  const nextCursor =
    hasNext && items.length > 0
      ? encodeMonthCursor(items[items.length - 1])
      : null;

  return {
    items,
    nextCursor,
  };
}
