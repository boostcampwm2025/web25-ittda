'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { RecordCard } from '@/components/ui/RecordCard';
import GalleryDrawer from '@/app/(post)/_components/GalleryDrawer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Users, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupListOptions } from '@/lib/api/group';
import {
  GroupCoverUpdateResponse,
  GroupSummary,
} from '@/lib/types/recordResponse';
import { GroupSortOption } from './SharedHeaderActions';
import { useApiPatch } from '@/hooks/useApi';

interface SharedRecordProps {
  searchParams: string;
  initialGroups?: GroupSummary[];
}

const sortGroups = (
  groups: GroupSummary[],
  sortBy: GroupSortOption,
): GroupSummary[] => {
  const sorted = [...groups];
  switch (sortBy) {
    case 'count':
      return sorted.sort((a, b) => b.recordCount - a.recordCount);
    case 'members':
      return sorted.sort((a, b) => b.memberCount - a.memberCount);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    default:
      return sorted;
  }
};

export default function SharedRecords({
  searchParams,
  initialGroups = [],
}: SharedRecordProps) {
  const queryClient = useQueryClient();
  const sortBy = (searchParams as GroupSortOption) || 'latest';

  const { data: groups = initialGroups } = useQuery({
    ...groupListOptions(),
    initialData: initialGroups,
  });

  const sortedGroups = useMemo(() => {
    if (sortBy === 'latest') return groups;
    return sortGroups(groups, sortBy);
  }, [groups, sortBy]);

  const router = useRouter();
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(
    undefined,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { mutate: updateGroupCover } = useApiPatch<GroupCoverUpdateResponse>(
    `/api/groups/${activeGroupId}/cover`,
    {
      onSuccess: (response) => {
        if (!response.data) return;
        const coverInfo = response.data;
        // 서버 응답 데이터를 캐시에 즉시 수정
        queryClient.setQueryData<GroupSummary[]>(['shared'], (old) => {
          if (!old) return [];

          return old.map((group) => {
            if (group.groupId === coverInfo.groupId) {
              const newCover = group.cover
                ? {
                    ...group.cover,
                    assetId: coverInfo.cover.assetId,
                  }
                : {
                    assetId: coverInfo.cover.assetId,
                    width: 500,
                    height: 500,
                    mimeType: 'image/jpeg',
                  };
              return {
                ...group,
                cover: newCover,
              };
            }
            return group;
          });
        });
      },
      onSettled: () => {
        // 백그라운드에서 서버와 동기화
        queryClient.invalidateQueries({ queryKey: ['shared'] });
      },
    },
  );

  const openGallery = (groupId: string) => {
    setActiveGroupId(groupId);
    setIsDrawerOpen(true);
  };

  const handleCoverSelect = (assetId: string, recordId: string) => {
    if (!activeGroupId) return;

    // 낙관적 업데이트: 캐시 직접 수정
    queryClient.setQueryData<GroupSummary[]>(['shared'], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((group) =>
        group.groupId === activeGroupId
          ? {
              ...group,
              cover: group.cover ? { ...group.cover, assetId } : null,
            }
          : group,
      );
    });

    updateGroupCover({ assetId: assetId, sourcePostId: recordId });
  };

  if (sortedGroups.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
        <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
          <Users className="w-6 h-6 text-[#10B981]" />
        </div>
        <div className="space-y-2 max-w-xs">
          <h3 className="text-sm font-bold dark:text-gray-200 text-gray-700">
            공유된 그룹이 없어요
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            친구들과 함께 기록을 공유할
            <br />
            새로운 그룹을 만들어보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {sortedGroups.map((g) => {
          const isViewer = g.permission === 'VIEWER';
          return (
            <RecordCard
              key={g.groupId}
              id={g.groupId}
              name={g.name}
              count={`${g.memberCount}명 • ${g.recordCount}기록`}
              latestTitle={g.latestPost?.title || '최신 기록이 없어요'}
              latestLocation={g.latestPost?.placeName}
              hasNotification={false}
              cover={g.cover}
              onClick={() => router.push(`/group/${g.groupId}`)}
              onChangeCover={
                isViewer ? undefined : () => openGallery(g.groupId)
              }
              createdAt={g.createdAt.split('T')[0]}
            />
          );
        })}
      </div>

      {/* 커버 변경 Drawer */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        shouldScaleBackground={false}
      >
        <DrawerContent className="w-full px-6 sm:px-8 pt-4 pb-8 sm:pb-10">
          <DrawerHeader>
            <div className="pt-4 flex justify-between items-center mb-6 sm:mb-8">
              <DrawerTitle className="flex flex-col justify-center items-start pl-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                  CHOOSE COVER
                </span>
                <span className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                  커버 사진 선택
                </span>
              </DrawerTitle>
              <DrawerClose className="p-2 text-gray-400 cursor-pointer">
                <X className="w-6 h-6" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <GalleryDrawer
            type="group"
            groupId={activeGroupId}
            currentAssetId={
              groups.find((g) => g.groupId === activeGroupId)?.cover?.assetId
            }
            onSelect={handleCoverSelect}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
