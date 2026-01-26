/**
 * React cache() 기반 서버 캐싱
 *
 * 사용법:
 * ```typescript
 * import { cache } from 'react';
 *
 * export const getCachedUserProfile = cache(async () => {
 *   const response = await get('/api/me');
 *   return response.data;
 * });
 * ```
 */

export { cache } from 'react';
