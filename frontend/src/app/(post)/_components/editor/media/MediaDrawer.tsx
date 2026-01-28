'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Search,
  X,
  Plus,
  AlertCircle,
  Film,
  Tv,
  Music,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { CategoryChip } from './MediaCategoryChip';
import { MediaManualInput } from './MediaManualInput';
import { searchKopis, searchMovies } from '@/lib/api/externalMedia';
import MediaField from './MediaField';
import { MediaValue } from '@/lib/types/recordField';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/utils/useDebounce';

interface MediaDrawerProps {
  onClose: () => void;
  onSelect: (media: MediaValue) => void;
}

const CATEGORIES = [
  { id: 'movie', label: '영화', icon: Film, code: 'movie' },
  { id: 'musical', label: '연극', icon: Tv, code: 'AAAA' },
  { id: 'theret', label: '뮤지컬', icon: Music, code: 'GGGA' },
];

export default function MediaDrawer({ onClose, onSelect }: MediaDrawerProps) {
  const [isManualInput, setIsManualInput] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 검색 카테고리
  const [searchType, setSearchType] = useState('영화');

  // 직접 입력
  const [manualType, setManualType] = useState('영화');
  const [manualTitle, setManualTitle] = useState('');
  const [manualYear, setManualYear] = useState('2026');

  const searchMedia = async (q: string, type: string) => {
    let data: MediaValue[] = [];
    if (type === '영화') {
      data = await searchMovies(q);
    } else {
      const cateCode = CATEGORIES.find((c) => c.label === type)?.code || '';
      data = await searchKopis(q, cateCode, type);
    }

    setResults(data);
    setIsLoading(false);
  };
  const debouncedSearch = useDebounce(searchMedia, 500);
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      setResults([]);
      return;
    }
    setIsLoading(true);
    debouncedSearch(query, searchType);
  }, [query, searchType]);

  const handleManualSubmit = () => {
    if (!manualTitle.trim()) return;
    onSelect({
      externalId: `user_${Date.now()}`,
      title: manualTitle,
      type: manualType,
      year: manualYear,
      originalTitle: null,
      imageUrl: undefined,
    });
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[85%] bg-white dark:bg-[#121212]">
        <div className="w-full flex flex-col h-full overflow-hidden">
          {/* 헤더 */}
          <DrawerHeader className="px-5 py-4 flex flex-row items-center border-b border-gray-50 dark:border-white/5 space-y-0">
            {isManualInput && (
              <button
                onClick={() =>
                  isManualInput ? setIsManualInput(false) : setQuery('')
                }
                className="p-1 active:scale-90 transition-transform"
              >
                <ArrowLeft className="w-6 h-6 text-itta-black dark:text-white" />
              </button>
            )}
            <DrawerTitle
              className={cn(
                'flex-1 text-center text-lg font-bold text-itta-black dark:text-white',
                isManualInput && 'mr-8',
              )}
            >
              {isManualInput ? '직접 정보 입력' : '정보 검색'}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!isManualInput ? (
              <>
                {/* 검색 바 및 칩 필터 */}
                <div className="p-5 space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-[#F4F4F4] dark:bg-white/5 border-none rounded-xl px-12 py-4 text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 transition-all outline-none text-itta-black dark:text-white"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-300 dark:bg-white/10 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3 text-white dark:text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* 검색 카테고리 Chips */}
                  <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        label={cat.label}
                        Icon={cat.icon}
                        isActive={searchType === cat.label}
                        onClick={() => setSearchType(cat.label)}
                        layout="h"
                      />
                    ))}
                  </div>
                </div>

                {/* 결과 리스트 */}
                <div className="px-5 pb-10">
                  {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                      <span className="text-xs text-gray-400">
                        검색 중 입니다 ...
                      </span>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="divide-y space-y-4  divide-gray-50 dark:divide-white/5">
                      {results.map((item, idx) => (
                        <MediaField
                          key={item.externalId}
                          data={item}
                          onClick={() => {
                            onSelect(item);
                          }}
                          mode="search"
                        />
                      ))}
                    </div>
                  ) : query.trim() ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <span className="text-xs">검색 결과가 없습니다.</span>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <MediaManualInput
                manualType={manualType}
                setManualType={setManualType}
                manualTitle={manualTitle}
                setManualTitle={setManualTitle}
                manualYear={manualYear}
                setManualYear={setManualYear}
              />
            )}
          </div>

          {/* 푸터 영역 */}
          <div className="p-6 bg-[#FBFBFB] dark:bg-[#1E1E1E] border-t border-gray-50 dark:border-white/5">
            {!isManualInput && (
              <div className="flex items-center gap-2 mb-6 px-1">
                <AlertCircle className="w-4 h-4 text-[#10B981]" />
                <p className="text-[12px] font-bold text-itta-black dark:text-gray-300">
                  찾으시는 결과가 없나요?
                </p>
              </div>
            )}

            <button
              onClick={() =>
                isManualInput ? handleManualSubmit() : setIsManualInput(true)
              }
              disabled={isManualInput && !manualTitle.trim()}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-xl transition-all active:scale-95 ${
                isManualInput
                  ? manualTitle.trim()
                    ? 'bg-itta-black text-white'
                    : 'bg-gray-200 text-gray-400'
                  : 'bg-itta-black text-white dark:bg-white dark:text-[#121212]'
              }`}
            >
              {isManualInput ? (
                <>정보 입력 완료</>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  직접 정보 입력하기
                </>
              )}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
