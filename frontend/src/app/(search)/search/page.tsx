'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { FilterChip } from '@/components/search/FilterChip';
import SearchItem from '../_components/SearchItem';
import { useDebounce } from '@/lib/utils/useDebounce';
import {
  makeDateLabel,
  // makeEmotionLabel,
  makeLocationLabel,
  makeTagLabel,
} from '@/lib/utils/filterLabels';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { FilterDrawerRenderer } from '@/components/search/FilterDrawerRender';
import Back from '@/components/Back';
import { useFrequentTags, useSearchQuery } from '@/hooks/useSearchQuery';

export default function SearchPage() {
  const router = useRouter();
  const [activeDrawer, setActiveDrawer] = useState<
    'tag' | 'date' | 'location' | 'emotion' | null
  >(null);
  const { data: frequentTagsData } = useFrequentTags(10);
  const frequentTags = frequentTagsData?.tags ?? [];

  const {
    query,
    tags: selectedTags,
    emotions: selectedEmotions,
    start: startDate,
    end: endDate,
    location,
    updateUrl,
  } = useSearchFilters({ withLocation: true });

  const locationAddress = location?.address ?? null;
  const [localQuery, setLocalQuery] = useState(query);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useSearchQuery({
      query,
      tags: selectedTags,
      emotions: selectedEmotions,
      start: startDate,
      end: endDate,
      location,
    });

  // 데이터 평탄화
  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  //  무한 스크롤 관찰자
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: '200px' },
      );

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const debouncedUpdateQuery = useDebounce((val: string) => {
    updateUrl({ q: val });
  }, 500);

  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    debouncedUpdateQuery(val);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md p-4 space-y-4">
        {/* 검색바 영역 */}
        <div className="flex items-center gap-3">
          <Back />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="제목이나 내용으로 검색"
              value={localQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full rounded-lg px-11 py-3 bg-gray-50 dark:bg-white/5 text-sm outline-none dark:text-white"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {localQuery && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* 필터 칩 영역 */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1">
          <FilterChip
            type="tag"
            label={makeTagLabel(selectedTags)}
            isActive={selectedTags.length > 0}
            onClick={() => setActiveDrawer('tag')}
            onClear={() => updateUrl({ tags: null })}
          />
          {/* <FilterChip
            type="emotion"
            label={makeEmotionLabel(selectedEmotions)}
            isActive={selectedEmotions.length > 0}
            onClick={() => setActiveDrawer('emotion')}
            onClear={() => updateUrl({ emotions: null })}
          /> */}
          <FilterChip
            type="date"
            label={makeDateLabel(startDate, endDate)}
            isActive={!!startDate}
            onClick={() => setActiveDrawer('date')}
            onClear={() => updateUrl({ start: null, end: null })}
          />
          <FilterChip
            type="location"
            label={makeLocationLabel(locationAddress)}
            isActive={!!locationAddress}
            onClick={() =>
              router.replace(
                `/location-picker?from=search&${new URLSearchParams(window.location.search)}`,
              )
            }
            onClear={() =>
              updateUrl({ lat: null, lng: null, address: null, radius: null })
            }
          />
        </div>
      </header>

      <main className="p-6 pb-20">
        <h3 className="text-md font-bold text-itta-gray3 uppercase tracking-tight mb-4">
          검색 결과 <span className="text-itta-point">{items.length}</span>
        </h3>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-itta-point" />
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((record, idx) => {
              const isLastItem = idx === items.length - 1;
              return (
                <div key={record.id} ref={isLastItem ? lastItemRef : null}>
                  <SearchItem
                    record={{
                      id: record.id,
                      title: record.title,
                      address: record.location?.address || '',
                      date: record.eventAt,
                      content: record.snippet,
                      imageUrl: record.thumbnailUrl || '',
                    }}
                    onClick={(id) => router.push(`/post/${id}`)}
                  />
                </div>
              );
            })}

            {/* 다음 페이지 로딩 중 표시 */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin w-6 h-6 text-itta-point" />
              </div>
            )}
          </div>
        ) : (
          /* 검색 결과 없음 UI */
          <div className="py-32 flex flex-col items-center text-center space-y-4">
            <Search className="w-12 h-12 text-gray-200" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-itta-gray3">
                찾으시는 기록이 없어요
              </p>
              <p className="text-xs text-itta-gray2">
                필터를 변경하거나 다른 단어로 검색해보세요.
              </p>
            </div>
          </div>
        )}
      </main>

      <FilterDrawerRenderer
        activeDrawer={activeDrawer}
        close={() => setActiveDrawer(null)}
        tags={selectedTags}
        emotions={selectedEmotions}
        dateRange={{ start: startDate, end: endDate }}
        onUpdateUrl={updateUrl}
        frequentTags={frequentTags ?? []}
      />
    </div>
  );
}
