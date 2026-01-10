'use client';

import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const emotions = {
  recent: [
    { name: '행복', emoji: '😊', count: 1 },
    { name: '슬픔', emoji: '😢', count: 1 },
    { name: '설렘', emoji: '🥰', count: 1 },
    { name: '좋음', emoji: '🥰', count: 1 },
    { name: '놀람', emoji: '😮', count: 1 },
  ],
  frequent: [
    { name: '행복', emoji: '😊', count: 6 },
    { name: '슬픔', emoji: '😢', count: 5 },
    { name: '설렘', emoji: '🥰', count: 4 },
    { name: '좋음', emoji: '🥰', count: 3 },
    { name: '놀람', emoji: '😮', count: 2 },
    { name: '화남', emoji: '😡', count: 1 },
    { name: '피곤', emoji: '😴', count: 1 },
  ],
  all: [
    { name: '슬픔', emoji: '😢', count: 5 },
    { name: '설렘', emoji: '🥰', count: 4 },
    { name: '좋음', emoji: '🥰', count: 3 },
    { name: '놀람', emoji: '😮', count: 2 },
    { name: '화남', emoji: '😡', count: 1 },
    { name: '피곤', emoji: '😴', count: 1 },
  ],
};

export default function EmotionDashboard() {
  const router = useRouter();
  const [tagTab, setTagTab] = useState<'recent' | 'frequent'>('recent');

  const currentEmotions = emotions[tagTab];

  return (
    <div className="rounded-2xl p-6 shadow-xs border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[13px] font-bold dark:text-white text-itta-black">
          감정
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
          currentEmotions.length > 0 ? 'mb-6' : 'mb-2',
        )}
      >
        {currentEmotions.length > 0 ? (
          currentEmotions.slice(0, 5).map((emotion) => (
            <div
              key={emotion.name}
              className="flex items-center h-fit gap-1.5 px-3 py-1.5 border rounded-lg shadow-xs dark:bg-white/5 dark:border-white/5 bg-white border-gray-100"
            >
              <span className="text-[11px] font-medium">{emotion.emoji}</span>
              <span className="text-[11px] font-medium dark:text-gray-200 text-itta-black">
                {emotion.name}
              </span>
              <span className="text-[10px] font-medium text-[#10B981]/90 ml-0.5">
                {emotion.count}
              </span>
            </div>
          ))
        ) : (
          <p className="w-full text-center py-4 text-[11px] text-gray-400">
            사용된 감정이 없습니다.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t pt-5 dark:border-white/5 border-gray-50">
        <button
          onClick={() => router.push('/profile/all-emotions')}
          className="cursor-pointer flex-1 py-3 text-xs font-bold text-gray-400 active:scale-95 transition-all hover:text-gray-500"
        >
          모두 보기
        </button>
      </div>
    </div>
  );
}
