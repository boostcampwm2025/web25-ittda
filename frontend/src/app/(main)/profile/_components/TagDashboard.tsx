'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ProfileTag } from '@/lib/types/profile';
import { cn } from '@/lib/utils';
import { Search, X, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TagDashboardProps {
  tags: ProfileTag;
}

export default function TagDashboard({ tags }: TagDashboardProps) {
  const [tagTab, setTagTab] = useState<'recent' | 'frequent'>('recent');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const router = useRouter();

  const currentTags = tags[tagTab];

  const toggleTagSelection = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleCombinationSearch = () => {
    // 검색 페이지로 이동하며 선택된 태그들을 쿼리로 전달
    // TODO: 검색 페이지에서 쿼리로 전달받은 태그를 입력창에 입력해주기(query)
    const query = selectedTags.map((t) => `#${t}`).join(' ');
    const tagQuery = selectedTags.join(',');
    router.push(`/search?tags=${encodeURIComponent(tagQuery)}`);
  };

  return (
    <div className="rounded-2xl p-6 shadow-xs border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[13px] font-bold dark:text-white text-itta-black">
          태그
        </h4>
        <div className="p-1 rounded-xl flex items-center dark:bg-black/20 bg-gray-50">
          <button
            onClick={() => setTagTab('recent')}
            className={cn(
              'cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border',
              tagTab === 'recent'
                ? 'dark:bg-white/10 dark:text-white bg-white text-itta-black shadow-xs border-black/5'
                : 'text-gray-400 border-transparent',
            )}
          >
            최근 사용
          </button>
          <button
            onClick={() => setTagTab('frequent')}
            className={cn(
              'cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border',
              tagTab === 'frequent'
                ? 'dark:bg-white/10 dark:text-white bg-white text-itta-black shadow-xs border-black/5'
                : 'text-gray-400 border-transparent',
            )}
          >
            자주 사용
          </button>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-wrap gap-2',
          currentTags.length > 0 ? 'mb-6' : 'mb-2',
        )}
      >
        {currentTags.length > 0 ? (
          currentTags.slice(0, 5).map((tag) => (
            <div
              key={tag.tag}
              className="flex items-center h-fit gap-1 px-3 py-1.5 border rounded-lg shadow-xs dark:bg-white/5 dark:border-white/5 bg-white border-gray-100"
            >
              <span className="text-[11px] font-medium text-[#10B981]">#</span>
              <span className="text-[11px] font-medium dark:text-gray-200 text-itta-black">
                {tag.tag}
              </span>
              <span className="text-[10px] font-medium text-[#10B981]/90 ml-0.5">
                {tag.count}
              </span>
            </div>
          ))
        ) : (
          <div className="w-full py-8 flex flex-col items-center justify-center gap-2">
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
        )}
      </div>

      <div className="flex items-center gap-2 border-t pt-5 dark:border-white/5 border-gray-50">
        <Drawer>
          <DrawerTrigger className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl text-xs font-bold text-[#10B981] active:scale-95 transition-all dark:bg-white/5 dark:border-white/5 bg-white border-gray-100">
            <Search className="w-3.5 h-3.5" />
            조합 검색
          </DrawerTrigger>
          <DrawerContent className="w-full px-8 pt-4 pb-10">
            <DrawerHeader className="mx-0 px-0">
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col justify-center items-start">
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                    Combo Search
                  </span>
                  <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                    여러 태그로 검색
                  </DrawerTitle>
                </div>
                <DrawerClose className="cursor-pointer p-2 text-gray-400">
                  <X className="w-6 h-6" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="max-h-[80vh] overflow-y-auto hide-scrollbar mb-8">
              <div className="flex flex-wrap gap-3 mb-2">
                {tags.all.map((tag) => {
                  const isSelected = selectedTags.includes(tag.tag);
                  return (
                    <button
                      key={tag.tag}
                      onClick={() => toggleTagSelection(tag.tag)}
                      className={cn(
                        'cursor-pointer flex items-center gap-0.5 px-4 py-2.5 border rounded-2xl transition-all active:scale-95',
                        isSelected
                          ? 'bg-itta-black dark:bg-itta-point border-itta-black text-white shadow-lg shadow-[#10B981]/20'
                          : 'dark:bg-white/5 dark:border-white/5 dark:text-gray-200 dark:hover:bg-white/10 bg-gray-50 border-gray-100 text-gray-500 hover:bg-white shadow-xs',
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-white' : 'text-[#10B981]',
                        )}
                      >
                        #
                      </span>
                      <span className="text-sm font-medium">{tag.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedTags([])}
                className="cursor-pointer flex-1 py-4 rounded-2xl text-sm font-bold dark:bg-white/5 dark:text-gray-500 bg-gray-50 text-gray-400"
              >
                초기화
              </button>
              <button
                onClick={handleCombinationSearch}
                disabled={selectedTags.length === 0}
                className={cn(
                  'cursor-pointer flex-2 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                  selectedTags.length > 0
                    ? 'bg-itta-black dark:bg-gray-100 text-white dark:text-itta-black shadow-[#10B981]/20'
                    : 'dark:bg-white/10 dark:text-gray-600 bg-gray-100 text-gray-300',
                )}
              >
                <Search className="w-5 h-5" />
                {selectedTags.length > 0
                  ? `${selectedTags.length}개의 태그 검색`
                  : '태그를 선택하세요'}
              </button>
            </div>
          </DrawerContent>
        </Drawer>
        <div className="w-px h-4 dark:bg-white/5 bg-gray-100" />
        <button
          onClick={() => router.push('/profile/all-tags')}
          className="cursor-pointer flex-1 py-3 text-xs font-bold text-gray-400 active:scale-95 transition-all hover:text-gray-500"
        >
          모두 보기
        </button>
      </div>
    </div>
  );
}
