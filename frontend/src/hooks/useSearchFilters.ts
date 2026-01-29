'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// 검색 필터링 시 파라미터 값 가져오기 위한 훅
export function useSearchFilters(options?: { withLocation?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';
  const tags = useMemo(
    () => searchParams.get('tags')?.split(',').filter(Boolean) || [],
    [searchParams],
  );
  const emotions = useMemo(
    () => searchParams.get('emotions')?.split(',').filter(Boolean) || [],
    [searchParams],
  );
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const location = useMemo(() => {
    if (!options?.withLocation) return undefined;

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const address = searchParams.get('address');

    if (lat && lng) {
      return {
        lat: Number(lat),
        lng: Number(lng),
        address: address || undefined,
        radius: radius ? Number(radius) : undefined,
      };
    }
    return undefined;
  }, [searchParams, options?.withLocation]);

  const updateUrl = useCallback(
    (params: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });

      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return {
    query,
    tags,
    emotions,
    start,
    end,
    location,
    updateUrl,
  };
}
