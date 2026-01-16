'use client';

import { ProfileEmotion } from '@/lib/types/profile';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EmotionListProps {
  emotions: ProfileEmotion;
  defaultTab?: 'recent' | 'frequent';
}

export default function EmotionList({ emotions, defaultTab = 'recent' }: EmotionListProps) {
  const [emotionTab, setEmotionTab] = useState<'recent' | 'frequent'>(defaultTab);
  const router = useRouter();

  const handleSingleTagSearch = (tagName: string) => {
    router.push(`/search?emotion=${tagName}`);
  };

  return (
    <>
      <div className="flex border-b transition-colors dark:border-white/5 border-gray-50">
        <button
          onClick={() => setEmotionTab('recent')}
          className={`cursor-pointer flex-1 py-4 text-[14px] font-medium relative transition-colors ${emotionTab === 'recent' ? 'dark:text-white text-itta-black' : 'text-gray-300'}`}
        >
          최근 사용한
          {emotionTab === 'recent' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-itta-black dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setEmotionTab('frequent')}
          className={`cursor-pointer flex-1 py-4 text-[14px] font-medium relative transition-colors ${emotionTab === 'frequent' ? 'dark:text-white text-itta-black' : 'text-gray-300'}`}
        >
          자주 사용한
          {emotionTab === 'frequent' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-itta-black dark:bg-white" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {emotions[emotionTab].length === 0 ? (
          <div className="flex px-3 py-10 items-center justify-center h-full">
            <p className="text-sm font-medium text-gray-400">
              사용된 감정이 없습니다.
            </p>
          </div>
        ) : (
          emotions[emotionTab].map((emotion) => (
            <button
              key={emotion.name}
              onClick={() => handleSingleTagSearch(emotion.name)}
              className="cursor-pointer w-full flex items-center justify-between px-6 py-5 border-b transition-colors active:bg-gray-50 dark:active:bg-white/5 dark:border-white/5 border-gray-50"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[15px]">{emotion.emoji}</span>
                <span className="text-[15px] font-medium dark:text-gray-200 text-itta-black">
                  {emotion.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium dark:text-gray-400 text-gray-600">
                  {emotion.count}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
