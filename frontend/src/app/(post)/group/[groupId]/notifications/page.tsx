'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { use, useRef, useCallback } from 'react';
import { groupActivitiesOptions } from '@/lib/api/group';
import { ActivityItem } from './_components/ActivityItem';
import { ActivityItemSkeleton } from './_components/ActivityItemSkeleton';
import { Loader2, Bell } from 'lucide-react';

interface GroupNotificationPageProps {
  params: Promise<{ groupId: string }>;
}

export default function GroupNotificationPage({
  params,
}: GroupNotificationPageProps) {
  const unwrappedParams = use(params);
  const { groupId } = unwrappedParams;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(groupActivitiesOptions(groupId));

  // 무한 스크롤 관찰자
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: '200px' },
      );

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  if (isLoading) {
    return (
      <div className="w-full flex flex-col">
        {Array.from({ length: 5 }).map((_, index) => (
          <ActivityItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  const activities = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="w-full flex flex-col">
      {activities.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200 mx-4 mt-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
            <Bell className="w-6 h-6 text-[#10B981]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
              아직 알림이 없어요
            </p>
            <p className="text-xs text-gray-400">
              그룹 활동이 생기면 알림이 표시됩니다
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              groupId={groupId}
            />
          ))}

          {hasNextPage && (
            <div ref={lastItemRef} className="py-4 flex justify-center">
              {isFetchingNextPage ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-itta-point" />
                </div>
              ) : (
                <div className="h-4" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
