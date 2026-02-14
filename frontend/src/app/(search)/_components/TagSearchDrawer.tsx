'use client';

import { useState, useMemo } from 'react';
import { Loader2, Search, Tag, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { userProfileTagSummaryOptions } from '@/lib/api/profile';
import { Tag as ITag } from '@/lib/types/record';
import { useQuery } from '@tanstack/react-query';

interface Props {
  onClose: () => void;
  allTags?: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onReset: () => void;
}

export default function TagSearchDrawer({
  onClose,
  allTags,
  selectedTags,
  onToggleTag,
  onReset,
}: Props) {
  const [keyword, setKeyword] = useState('');
  const { data: tags, isPending } = useQuery(userProfileTagSummaryOptions(10));

  const suggestedTags = useMemo(() => {
    return tags?.frequentTags.map((item: ITag) => item.tag);
  }, [tags]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && keyword.trim()) {
      e.preventDefault();
      // 이미 선택된 태그가 아니라면 추가
      if (!selectedTags.includes(keyword.trim())) {
        onToggleTag(keyword.trim());
      }
      setKeyword(''); // 입력창 초기화
    }
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="dark:bg-[#1E1E1E]">
        <div className="w-full p-6 pt-4 flex flex-col gap-4">
          <DrawerHeader className="px-0 relative">
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-itta-point uppercase tracking-widest mb-1">
                COMBO SEARCH
              </span>
              <DrawerTitle className="text-xl font-bold text-itta-black dark:text-white">
                여러 태그로 검색
              </DrawerTitle>
            </div>
          </DrawerHeader>

          {/* 현재 선택된 태그 리스트 */}
          {selectedTags.length !== 0 && (
            <div className="flex flex-wrap gap-2 mb-3 min-h-8">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-itta-point/10 text-itta-point text-xs font-bold animate-in fade-in zoom-in-95"
                >
                  #{tag}
                  <X
                    size={14}
                    className="cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => onToggleTag(tag)}
                  />
                </span>
              ))}
            </div>
          )}
          {/* 검색 및 상태 입력창 */}
          <div className="flex-[2.5] relative group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-itta-gray2 group-focus-within:text-itta-point transition-colors"
            />
            <input
              type="text"
              placeholder={
                selectedTags.length > 0
                  ? `${selectedTags.length}개의 태그 선택됨`
                  : '태그를 선택하세요'
              }
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full py-4 pl-12 pr-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none text-base font-bold text-itta-black dark:text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-itta-point/20 transition-all shadow-inner"
            />
          </div>

          {/* 태그 목록 영역 */}
          {isPending && (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#121212]">
              <Loader2 className="w-8 h-8 animate-spin text-itta-point" />
            </div>
          )}
          <section className="flex flex-col space-y-4 ">
            <p className="text-xs font-bold text-itta-gray3 uppercase tracking-widest leading-none">
              자주 사용한 태그
            </p>
            {suggestedTags && suggestedTags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-10 min-h-30 content-start overflow-y-auto max-h-75 hide-scrollbar">
                {suggestedTags?.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onToggleTag(tag)}
                      className={`px-4 py-2 rounded-2xl text-sm font-bold border transition-all ${
                        isSelected
                          ? 'bg-itta-point/5 border-itta-point text-itta-point'
                          : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-itta-gray3 hover:border-gray-200'
                      }`}
                    >
                      <span
                        className={
                          isSelected ? 'text-itta-point' : 'text-itta-point/40'
                        }
                      >
                        #
                      </span>{' '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
            {suggestedTags?.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="w-full py-2 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
                    <Tag className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
                      아직 사용한 태그가 없어요
                    </p>
                    <p className="text-xs text-gray-400">
                      태그를 추가하여 기록을 분류해보세요
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 하단 액션바 */}
          <div className="flex gap-3 items-center">
            <button
              onClick={onReset}
              className="flex-1 py-4 bg-white dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-2xl text-itta-point font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              초기화
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-itta-black text-white dark:bg-white dark:text-black border border-gray-50 dark:border-white/5 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              완료
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
