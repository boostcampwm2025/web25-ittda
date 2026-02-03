'use client';

import { EMOTION_MAP } from '@/lib/constants/constants';
import { EmotionStatSummary } from '@/lib/types/profile';
import { ChevronRight, Smile } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EmotionListProps {
  emotions: EmotionStatSummary['emotion'];
  defaultTab?: 'recent' | 'frequent';
}

export default function EmotionList({
  emotions,
  defaultTab = 'recent',
}: EmotionListProps) {
  const [emotionTab, setEmotionTab] = useState<'recent' | 'frequent'>(
    defaultTab,
  );
  const router = useRouter();
  const sortedEmotions = {
    recent: emotions,
    frequent: emotions.sort((a, b) => b.count - a.count),
  };

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
        {sortedEmotions[emotionTab].length === 0 ? (
          <div className="flex px-3 py-10 items-center justify-center h-full">
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
                <Smile className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
                  아직 기록한 감정이 없어요
                </p>
                <p className="text-xs text-gray-400">
                  오늘의 기분을 기록해보세요
                </p>
              </div>
            </div>
          </div>
        ) : (
          sortedEmotions[emotionTab].map((emotion) => (
            <button
              key={emotion.emotion}
              onClick={() => handleSingleTagSearch(emotion.emotion)}
              className="cursor-pointer w-full flex items-center justify-between px-6 py-5 transition-colors active:bg-gray-50 dark:active:bg-white/5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[15px]">
                  {EMOTION_MAP[emotion.emotion]}
                </span>
                <span className="text-[15px] font-medium dark:text-gray-200 text-itta-black">
                  {emotion.emotion}
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
