'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import {
  userProfileOptions,
  userProfileEmotionSummaryOptions,
} from '@/lib/api/profile';
import EmotionList from './EmotionList';

export default function AllEmotionsContent() {
  const { data: profile } = useSuspenseQuery(userProfileOptions());
  const { data: emotionData } = useSuspenseQuery(
    userProfileEmotionSummaryOptions(),
  );

  return (
    <div className="p-4 sm:p-5">
      <div className="rounded-xl p-4 sm:p-6 transition-colors dark:bg-white/5 bg-gray-50">
        <p className="text-[13px] sm:text-sm leading-relaxed mb-1 dark:text-gray-400 text-gray-500">
          <span className="font-bold">{profile.user.nickname}</span> 님은
        </p>
        <p className="text-[13px] sm:text-sm leading-relaxed dark:text-gray-400 text-gray-500">
          <span className="font-black text-itta-black dark:text-white">
            {emotionData.emotion.length}
          </span>
          &nbsp;개의 감정을 사용하고 있어요.
        </p>
      </div>

      <EmotionList emotions={emotionData.emotion} />
    </div>
  );
}
