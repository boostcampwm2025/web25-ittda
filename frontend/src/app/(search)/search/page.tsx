'use client';

import { useMemo, useCallback, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import TagSearchDrawer from '../_components/TagSearchDrawer';
import { FilterChip } from '@/components/FilterChip';
import SearchItem from '../_components/SearchItem';
import DateDrawer from '@/components/DateDrawer';
import LocationDrawer from '@/components/map/LocationDrawer';
import { RecordSearchItem } from '@/lib/types/record';
import { useDebounce } from '@/lib/utils/useDebounce';
import { LocationValue } from '@/lib/types/recordField';
import Back from '@/components/Back';

const ALL_TAGS = [
  '일상',
  '맛집',
  '성수동',
  '여행',
  '운동',
  '독서',
  '가족',
  '카페',
];

const dummyRecords: RecordSearchItem[] = [
  {
    id: '1',
    title: '성수동 팝업 스토어 나들이',
    address: '성수동 카페거리',
    date: '2025.12.21',
    content:
      '드디어 가보고 싶었던 성수동 팝업 스토어 방문! 웨이팅은 길었지만 굿즈들이 너무 귀여웠다.',
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400',
    tags: ['성수동', '일상', '맛집'],
  },
  {
    id: '2',
    title: '주말 아침 러닝 기록',
    address: '뚝섬한강공원',
    date: '2025.12.20',
    content:
      '날씨가 꽤 추워졌지만 달리고 나니 상쾌하다. 한강 공원 코스는 언제나 좋다.',
    imageUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=400',
    tags: ['운동', '일상'],
  },
  {
    id: '3',
    title: '가족과 함께한 제주도 여행',
    address: '제주 함덕 해변',
    date: '2025.11.15',
    content:
      '오랜만에 가족들과 제주도 여행. 에메랄드빛 바다와 맛있는 흑돼지 구이.',
    imageUrl:
      'https://images.unsplash.com/photo-1506477331477-33d6d8b3dc85?q=80&w=400',
    tags: ['여행', '가족', '맛집'],
  },
];

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeDrawer, setActiveDrawer] = useState<
    'tag' | 'date' | 'location' | null
  >(null);

  // URL에서 데이터 필터 상태 가져옴
  const query = searchParams.get('q') || '';
  const selectedTags = useMemo(() => {
    return searchParams.get('tags')?.split(',').filter(Boolean) || [];
  }, [searchParams]);

  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  //현재는 never used 떠서 삭제. 이후 실제 백엔드 로직 거칠 때 사용될듯
  //const lat = searchParams.get('lat');
  //const lng = searchParams.get('lng');
  const address = searchParams.get('address');
  //const radius = searchParams.get('radius');

  // 로컬 검색어 상태
  const [localQuery, setLocalQuery] = useState(query);

  // 이후에는 백엔드 로직으로 대체될 부분으로
  // 프론트에서 임시로 필터링 처리함(보여주기위한 용도)
  const filteredResults = useMemo(() => {
    let results = [...dummyRecords];

    // 검색어 필터링
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerQuery) ||
          r.content.toLowerCase().includes(lowerQuery),
      );
    }

    // 태그 필터링
    if (selectedTags.length > 0) {
      results = results.filter((r) =>
        selectedTags.some((tag) => r.tags?.includes(tag)),
      );
    }

    // 날짜 필터링
    if (startDate) {
      results = results.filter((r) => {
        if (!endDate) return r.date === startDate;
        return r.date >= startDate && r.date <= endDate;
      });
    }

    // 위치 필터링 (더미데이터에는 좌표가 없으므로 주소 텍스트 포함 여부로 예시)
    if (address) {
      results = results.filter((r) => r.address.includes(address));
    }

    return results;
  }, [query, selectedTags, startDate, endDate, address]);

  // URL 업데이트
  const updateUrl = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  // 검색어 디바운스
  const debouncedUpdateQuery = useDebounce((val: string) => {
    updateUrl({ q: val });
  }, 500);

  const handleQueryChange = (query: string) => {
    setLocalQuery(query);
    debouncedUpdateQuery(query);
  };

  // 위치 필터 핸들러
  const handleLocationSelect = (loc: LocationValue) => {
    updateUrl({
      lat: String(loc.lat),
      lng: String(loc.lng),
      address: loc.address || null,
      radius: String(loc.radius || 5000),
    });
    setActiveDrawer(null);
  };

  // 날짜 필터 핸들러
  const handleDateSelect = (range: {
    start: string | null;
    end: string | null;
  }) => {
    updateUrl({
      start: range.start,
      end: range.end,
    });
    setActiveDrawer(null);
  };

  const handleTagsSelect = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    updateUrl({ tags: nextTags.join(',') });
  };

  // 필터칩 내부 텍스트 계산
  const tagLabel = useMemo(() => {
    if (selectedTags.length === 0) return '태그';
    return selectedTags.length === 1
      ? `#${selectedTags[0]}`
      : `#${selectedTags[0]} 외 ${selectedTags.length - 1}`;
  }, [selectedTags]);

  const dateLabel = useMemo(() => {
    if (!startDate) return '날짜';
    if (!endDate || startDate === endDate) return startDate.slice(2);
    return `${startDate.slice(2)} ~ ${endDate.slice(2)}`;
  }, [startDate, endDate]);

  const locationLabel = address || '위치';

  // 드로어 렌더링
  const renderActiveDrawer = () => {
    switch (activeDrawer) {
      case 'tag':
        return (
          <TagSearchDrawer
            onClose={() => setActiveDrawer(null)}
            allTags={ALL_TAGS}
            selectedTags={selectedTags}
            onToggleTag={handleTagsSelect}
            onReset={() => updateUrl({ tags: null })}
          />
        );
      case 'date':
        return (
          <DateDrawer
            mode="range"
            currentRange={{ start: startDate, end: endDate }}
            onSelectRange={handleDateSelect}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'location':
        return (
          <LocationDrawer
            mode="search"
            onSelect={handleLocationSelect}
            onClose={() => setActiveDrawer(null)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md p-4 space-y-4">
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

        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1">
          <FilterChip
            type="tag"
            label={tagLabel}
            isActive={selectedTags.length > 0}
            onClick={() => setActiveDrawer('tag')}
            onClear={() => updateUrl({ tags: null })}
          />
          <FilterChip
            type="date"
            label={dateLabel}
            isActive={!!startDate}
            onClick={() => setActiveDrawer('date')}
            onClear={() => updateUrl({ start: null, end: null })}
          />
          <FilterChip
            type="location"
            label={locationLabel}
            isActive={!!address}
            onClick={() => setActiveDrawer('location')}
            onClear={() =>
              updateUrl({ lat: null, lng: null, address: null, radius: null })
            }
          />
        </div>
      </header>

      <main className="p-6">
        <h3 className="text-md font-bold text-itta-gray3 uppercase tracking-tight mb-4">
          검색 결과{' '}
          <span className="text-itta-point">{filteredResults.length}</span>
        </h3>

        {filteredResults.length > 0 ? (
          <div className="space-y-3">
            {filteredResults.map((record) => (
              <SearchItem
                key={record.id}
                record={record}
                onClick={(id) => router.push(`/post/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-200" />
            </div>
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

      {renderActiveDrawer()}
    </div>
  );
}
