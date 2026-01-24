'use client';

import { useParams, useRouter } from 'next/navigation';
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
import { BookOpen, Plus, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MyCoverUpdateResponse,
  MonthlyRecordList,
} from '@/lib/types/recordResponse';
import { useApiPatch } from '@/hooks/useApi';
import { myMonthlyRecordListOptions } from '@/lib/api/my';
import { convertMontRecords } from '../_utils/convertMonthRecords';

interface MonthRecordsProps {
  monthRecords: MonthlyRecordList[];
  cardRoute: string;
}

export default function MonthRecords({
  monthRecords,
  cardRoute,
}: MonthRecordsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeMonthId, setActiveMonthId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { groupId, year } = useParams();

  const { data: months = [] } = useQuery({
    ...myMonthlyRecordListOptions(),
    initialData: monthRecords,
    select: (data: MonthlyRecordList[]) => convertMontRecords(data),
  });

  const openGallery = (monthId: string) => {
    setActiveMonthId(monthId);
    setIsDrawerOpen(true);
  };

  const { mutate: updateGroupCover } = useApiPatch<MyCoverUpdateResponse>(
    `/api/user/archives/months/${activeMonthId}/cover`,
    {
      onSuccess: (response) => {
        if (!response.data) return;
        const coverInfo = response.data;
        // 서버 응답 데이터를 캐시에 즉시 수정
        queryClient.setQueryData<MonthlyRecordList[]>(
          year
            ? ['my', 'records', 'month', new Date().getFullYear().toString()]
            : ['my', 'records', 'month'],
          (old) => {
            if (!old) return [];
            return old.map((my) => {
              if (my.month === activeMonthId) {
                return {
                  ...my,
                  coverAssetId: coverInfo.coverAssetId,
                };
              }
              return my;
            });
          },
        );
      },
      onSettled: () => {
        // 백그라운드에서 서버와 동기화
        queryClient.invalidateQueries({
          queryKey: year
            ? ['my', 'records', 'month', year]
            : ['my', 'records', 'month'],
        });
      },
    },
  );

  const handleCoverSelect = (assetId: string, recordId: string) => {
    if (!activeMonthId) return;

    // 낙관적 업데이트: 캐시 직접 수정
    queryClient.setQueryData<MonthlyRecordList[]>(
      year ? ['my', 'records', 'month', year] : ['my', 'records', 'month'],
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((my) =>
          my.month === activeMonthId
            ? {
                ...my,
                coverAssetId: assetId,
              }
            : my,
        );
      },
    );

    updateGroupCover({ assetId: assetId, sourcePostId: recordId });
  };

  if (months.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
        <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
          <BookOpen className="w-6 h-6 text-[#10B981]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
            아직 기록이 없어요
          </p>
          <p className="text-xs text-gray-400">첫 번째 추억을 남겨보세요</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/add')}
          className="mt-2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#10B981] shadow-lg shadow-[#10B981]/20 hover:bg-[#0ea472] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          기록 추가하기
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {months.map((m) => (
          <RecordCard
            key={m.id}
            id={m.id}
            name={m.name}
            count={m.count}
            latestTitle={m.latestTitle}
            latestLocation={m.latestLocation}
            cover={m.cover}
            onClick={() => router.push(`${cardRoute}/${m.id}`)}
            onChangeCover={openGallery}
          />
        ))}
      </div>

      {/* 커버 변경 Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
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
            type={groupId ? 'group' : 'personal'}
            currentAssetId={
              months.find((m) => m.id === activeMonthId)?.cover?.assetId
            }
            onSelect={handleCoverSelect}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
