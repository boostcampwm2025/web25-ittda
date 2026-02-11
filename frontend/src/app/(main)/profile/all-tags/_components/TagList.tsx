'use client';

import { TagStatSummary } from '@/lib/types/profile';
import { ChevronRight, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TagListProps {
  tags: TagStatSummary;
  defaultTab?: 'recentTags' | 'frequentTags';
}

export default function TagList({
  tags,
  defaultTab = 'recentTags',
}: TagListProps) {
  const [tagTab, setTagTab] = useState<'recentTags' | 'frequentTags'>(
    defaultTab,
  );
  const router = useRouter();

  const handleSingleTagSearch = (tagName: string) => {
    router.push(`/search?tags=${tagName}`);
  };

  return (
    <>
      <div className="flex border-b transition-colors dark:border-white/5 border-gray-50">
        <button
          onClick={() => setTagTab('recentTags')}
          className={`cursor-pointer flex-1 py-3 sm:py-4 text-[13px] sm:text-sm font-medium relative transition-colors ${tagTab === 'recentTags' ? 'dark:text-white text-itta-black' : 'text-gray-300'}`}
        >
          최근 사용한
          {tagTab === 'recentTags' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-itta-black dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setTagTab('frequentTags')}
          className={`cursor-pointer flex-1 py-3 sm:py-4 text-[13px] sm:text-sm font-medium relative transition-colors ${tagTab === 'frequentTags' ? 'dark:text-white text-itta-black' : 'text-gray-300'}`}
        >
          자주 사용한
          {tagTab === 'frequentTags' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-itta-black dark:bg-white" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {tags[tagTab].length === 0 ? (
          <div className="flex px-3 py-8 sm:py-10 items-center justify-center h-full">
            <div className="w-full py-6 sm:py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs sm:text-sm font-bold dark:text-gray-200 text-gray-700">
                  아직 사용한 태그가 없어요
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400">
                  태그를 추가하여 기록을 분류해보세요
                </p>
              </div>
            </div>
          </div>
        ) : (
          tags[tagTab].map((tag) => (
            <button
              key={tag.tag}
              onClick={() => handleSingleTagSearch(tag.tag)}
              className="cursor-pointer w-full flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-5 border-b transition-colors active:bg-gray-50 dark:active:bg-white/5 dark:border-white/5 border-gray-50"
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[#10B981] font-medium text-[13px] sm:text-[15px]">
                  #
                </span>
                <span className="text-[13px] sm:text-[15px] font-medium dark:text-gray-200 text-itta-black">
                  {tag.tag}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[12px] sm:text-[14px] font-medium dark:text-gray-400 text-gray-600">
                  {tag.count}
                </span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
