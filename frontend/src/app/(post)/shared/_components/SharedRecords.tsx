'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { GroupSummary } from '@/lib/types/recordResponse';

export default function SharedRecords() {
  const queryClient = useQueryClient();
  const { data: groups = [] } = useQuery(groupListOptions());

  const router = useRouter();
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(
    undefined,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openGallery = (groupId: string) => {
    setActiveGroupId(groupId);
    setIsDrawerOpen(true);
  };

  const handleCoverSelect = (assetId: string) => {
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

    // TODO: 서버로 커버 변경 요청 보내기
    // 실패 시 queryClient.invalidateQueries(['shared'])로 롤백
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {groups.map((g) => (
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
