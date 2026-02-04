'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Clock } from 'lucide-react';
import { FilterChip } from '@/components/search/FilterChip';
import SearchItem from '../_components/SearchItem';
import { useDebounce } from '@/lib/utils/useDebounce';
import {
  makeDateLabel,
  makeEmotionLabel,
  makeLocationLabel,
  makeTagLabel,
} from '@/lib/utils/filterLabels';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { FilterDrawerRenderer } from '@/components/search/FilterDrawerRender';
import Back from '@/components/Back';
import {
  useFrequentTags,
  useRecentSearches,
  useSearchQuery,
} from '@/hooks/useSearchQuery';
import { useQueryClient } from '@tanstack/react-query';

export default function SearchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeDrawer, setActiveDrawer] = useState<
    'tag' | 'date' | 'location' | 'emotion' | null
  >(null);
  const { data: frequentTagsData } = useFrequentTags(10);
  const { data: recentSearchesData } = useRecentSearches();
  const frequentTags = frequentTagsData?.tags ?? [];
  const recentKeywords = recentSearchesData?.keywords ?? [];

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
  const { debounced: debouncedUpdateQuery, cancel } = useDebounce(
    (val: string) => {
      updateUrl({ q: val });
    },
    1_000,
  );

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

  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    if (val === '') {
      cancel();
      updateUrl({ q: null });
      queryClient.invalidateQueries({ queryKey: ['search', 'recent'] });
      return;
    }

    debouncedUpdateQuery(val);
  };

  // 키워드 클릭 핸들러
  const handleKeywordClick = (val: string) => {
    setLocalQuery(val); // input 필드 업데이트
    updateUrl({ q: val });
  };
  const isInitialState =
    !query &&
    selectedTags.length === 0 &&
    !startDate &&
    !location &&
    selectedEmotions.length === 0;
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
              className="w-full rounded-lg px-11 py-3 bg-gray-50 dark:bg-white/5 text-base outline-none dark:text-white"
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
          <FilterChip
            type="emotion"
            label={makeEmotionLabel(selectedEmotions)}
            isActive={selectedEmotions.length > 0}
            onClick={() => setActiveDrawer('emotion')}
            onClear={() => updateUrl({ emotions: null })}
          />
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
      {isInitialState ? (
        <section className="space-y-4 px-6 py-3">
          <div className="flex items-center gap-2 text-itta-gray3 font-bold text-sm">
            <Clock size={16} />
            <span>최근 검색어</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentKeywords.length > 0 ? (
              recentKeywords.map((kw, i) => (
                <button
                  key={i}
                  onClick={() => handleKeywordClick(kw)}
                  className="px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
                >
                  {kw}
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400">
                최근 검색 기록이 없습니다.
              </p>
            )}
          </div>
        </section>
      ) : (
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
                      onClick={(id) => router.push(`/record/${id}`)}
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
      )}

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
