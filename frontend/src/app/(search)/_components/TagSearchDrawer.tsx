'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface Props {
  onClose: () => void;
  allTags: string[];
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

  const filteredTags = useMemo(() => {
    return allTags.filter((tag) =>
      tag.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [allTags, keyword]);

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
              className="w-full py-4 pl-12 pr-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none text-sm font-bold text-itta-black dark:text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-itta-point/20 transition-all shadow-inner"
            />
          </div>

          {/* 태그 목록 영역 */}
          <section className="flex flex-col space-y-4 ">
            <p className="text-xs font-bold text-itta-gray3 uppercase tracking-widest leading-none">
              자주 사용한 태그
            </p>
            <div className="flex flex-wrap gap-2 mb-10 min-h-[120px] content-start overflow-y-auto max-h-[300px] hide-scrollbar">
              {filteredTags.map((tag) => {
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
              {filteredTags.length === 0 && (
                <p className="text-sm text-gray-400 w-full text-center py-10">
                  검색 결과가 없습니다.
                </p>
              )}
            </div>
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
              className="flex-1 py-4 bg-itta-black dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-2xl text-white font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              완료
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
