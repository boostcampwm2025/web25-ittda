'use client';

import { ProfileTag } from '@/lib/types/profile';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TagListProps {
  tags: ProfileTag;
}

export default function TagList({ tags }: TagListProps) {
  const [tagTab, setTagTab] = useState<'recent' | 'frequent'>('recent');
  const router = useRouter();

  const handleSingleTagSearch = (tagName: string) => {
    router.push(`/search?tag=${tagName}`);
  };

  return (
    <>
      <div className="flex border-b transition-colors dark:border-white/5 border-gray-50">
        <button
          onClick={() => setTagTab('recent')}
          className={`cursor-pointer flex-1 py-4 text-[14px] font-medium relative transition-colors ${tagTab === 'recent' ? 'dark:text-white text-itta-black' : 'text-gray-300'}`}
        >
          최근 사용한
          {tagTab === 'recent' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-itta-black dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setTagTab('frequent')}
          className={`cursor-pointer flex-1 py-4 text-[14px] font-medium relative transition-colors ${tagTab === 'frequent' ? 'dark:text-white text-itta-black' : 'text-gray-300'}`}
        >
          자주 사용한
          {tagTab === 'frequent' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-itta-black dark:bg-white" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {tags[tagTab].map((tag) => (
          <button
            key={tag.name}
            onClick={() => handleSingleTagSearch(tag.name)}
            className="cursor-pointer w-full flex items-center justify-between px-6 py-5 border-b transition-colors active:bg-gray-50 dark:active:bg-white/5 dark:border-white/5 border-gray-50"
          >
            <div className="flex items-center gap-0.5">
              <span className="text-[#10B981] font-medium text-[15px]">#</span>
              <span className="text-[15px] font-medium dark:text-gray-200 text-itta-black">
                {tag.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium dark:text-gray-400 text-gray-600">
                {tag.count}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
