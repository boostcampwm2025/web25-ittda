'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { groupListOptions } from '@/lib/api/group';
import { GroupSummary } from '@/lib/types/recordResponse';

// 사진 데이터
const recordPhotosData = [
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&q=80&w=400',
];

export default function SharedRecords() {
  const { data: sharedRecords = [] } = useQuery(groupListOptions());

  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[]>(sharedRecords);
  const [activeMonthId, setActiveMonthId] = useState<string | undefined>(
    undefined,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setGroups(sharedRecords);
  }, [sharedRecords]);

  const openGallery = (assetId: string | undefined) => {
    setActiveMonthId(assetId);
    setIsDrawerOpen(true);
  };

  // 현재 선택된 월의 사진들 가져오기
  const activeGroup = groups.find((m) => m.groupId === activeMonthId);
  // TODO: 서버로부터 사진 목록 받아오기(activeMonth를 키 값으로 가져오기)
  const recordPhotos = recordPhotosData || [];

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
            onChangeCover={() => openGallery(g.cover?.assetId)}
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
            recordPhotos={recordPhotos}
            value={groups}
            setValue={setGroups}
            activeId={activeMonthId}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
