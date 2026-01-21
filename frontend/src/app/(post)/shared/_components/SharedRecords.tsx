'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
import { X } from 'lucide-react';
import { formatDateISO } from '@/lib/date';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupListOptions } from '@/lib/api/group';
import {
  GroupCoverUpdateResponse,
  GroupSummary,
} from '@/lib/types/recordResponse';
import { GroupSortOption } from './SharedHeaderActions';
import { useApiPatch } from '@/hooks/useApi';

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

export default function SharedRecords() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const sortBy = (searchParams.get('sort') as GroupSortOption) || 'latest';

  const { data: groups = [] } = useQuery(groupListOptions());

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

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {sortedGroups.map((g) => (
          <RecordCard
            key={g.groupId}
            id={g.groupId}
            name={g.name}
            count={`${g.memberCount}명 • ${g.recordCount}기록`}
            latestTitle={g.latestPost?.title || '최신 기록이 없어요'}
            latestLocation={
              g.latestPost?.placeName || '최신 기록 위치값이 없어요'
            }
            hasNotification={false}
            cover={g.cover}
            onClick={() => router.push(`/group/${g.groupId}`)}
            onChangeCover={() => openGallery(g.groupId)}
            createdAt={formatDateISO(new Date(g.createdAt))}
          />
        ))}
      </div>

      {/* 커버 변경 Drawer */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        shouldScaleBackground={false}
      >
        <DrawerContent className="w-full px-8 py-4 pb-10">
          <DrawerHeader>
            <div className="pt-4 flex justify-between items-center mb-6">
              <DrawerTitle className="flex flex-col">
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                  CHOOSE COVER
                </span>
                <span className="text-lg font-bold dark:text-white text-itta-black">
                  커버 사진 선택
                </span>
              </DrawerTitle>
              <DrawerClose className="p-2 text-gray-400 cursor-pointer">
                <X className="w-6 h-6" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <GalleryDrawer
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
