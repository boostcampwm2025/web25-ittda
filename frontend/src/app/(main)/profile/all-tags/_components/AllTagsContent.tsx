'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import {
  userProfileOptions,
  userProfileTagSummaryOptions,
} from '@/lib/api/profile';
import TagList from './TagList';

export default function AllTagsContent() {
  const { data: profile } = useSuspenseQuery(userProfileOptions());
  const { data: tagData } = useSuspenseQuery(userProfileTagSummaryOptions());

  return (
    <div className="p-4 sm:p-5">
      <div className="rounded-xl p-4 sm:p-6 transition-colors dark:bg-white/5 bg-gray-50">
        <p className="text-[13px] sm:text-sm leading-relaxed mb-1 dark:text-gray-400 text-gray-500">
          <span className="font-bold">{profile.user.nickname}</span> 님은
        </p>
        <p className="text-[13px] sm:text-sm leading-relaxed dark:text-gray-400 text-gray-500">
          <span className="font-black text-itta-black dark:text-white">
            {tagData.frequentTags.length}
          </span>
          &nbsp;개의 태그를 사용하고 있어요.
        </p>
      </div>

      <TagList tags={tagData} />
    </div>
  );
}
