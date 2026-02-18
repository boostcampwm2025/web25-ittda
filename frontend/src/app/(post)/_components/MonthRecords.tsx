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
  MontlyCoverUpdateResponse,
  MonthlyRecordList,
} from '@/lib/types/recordResponse';
import { useApiPatch } from '@/hooks/useApi';
import { myMonthlyRecordListOptions } from '@/lib/api/my';
import { convertMontRecords } from '../_utils/convertMonthRecords';
import {
  groupMonthlyRecordListOptions,
  groupMyRoleOptions,
} from '@/lib/api/group';

interface MonthRecordsProps {
  monthRecords?: MonthlyRecordList[];
  cardRoute: string;
  groupId?: string;
}

export default function MonthRecords({
  groupId,
  monthRecords,
  cardRoute,
}: MonthRecordsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeMonthId, setActiveMonthId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const params = useParams() as { year?: string };
  const year = params.year || new Date().getFullYear().toString();

  const options = groupId
    ? groupMonthlyRecordListOptions(groupId, year)
    : myMonthlyRecordListOptions(year);

  const { data: months = [] } = useQuery({
    ...options,
    ...(monthRecords && { initialData: monthRecords }),
    select: (data: MonthlyRecordList[]) => convertMontRecords(data),
  });

  // 그룹 게시글인 경우 권한 확인
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(groupId!),
    enabled: !!groupId,
  });

  const isViewer = roleData?.role === 'VIEWER';

  const openGallery = (monthId: string) => {
    setActiveMonthId(monthId);
    setIsDrawerOpen(true);
  };

  const cacheKey = groupId
    ? ['group', groupId, 'records', 'month']
    : ['my', 'records', 'month'];

  const coverEndpoint = groupId
    ? `/api/groups/${groupId}/archives/months/${activeMonthId}/cover`
    : `/api/user/archives/months/${activeMonthId}/cover`;

  const { mutate: updateCover } = useApiPatch<MontlyCoverUpdateResponse>(
    coverEndpoint,
    {
      onSuccess: (response) => {
        if (!response.data) return;
        const coverInfo = response.data;
        queryClient.setQueryData<MonthlyRecordList[]>(cacheKey, (old) => {
          if (!old) return [];
          return old.map((item) =>
            item.month === activeMonthId
              ? { ...item, coverAssetId: coverInfo.coverAssetId }
              : item,
          );
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: cacheKey });
      },
    },
  );

  const handleCoverSelect = (assetId: string, recordId: string) => {
    if (!activeMonthId) return;

    // 낙관적 업데이트
    queryClient.setQueryData<MonthlyRecordList[]>(cacheKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((item) =>
        item.month === activeMonthId
          ? { ...item, coverAssetId: assetId }
          : item,
      );
    });

    updateCover(groupId ? { assetId, sourcePostId: recordId } : { assetId });
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
          onClick={() =>
            !isViewer &&
            (groupId
              ? router.push(`/add?groupId=${groupId}`)
              : router.push('/add'))
          }
          disabled={groupId ? isViewer : false}
          className={`mt-2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
            groupId && isViewer
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-200 shadow-gray-400/20'
              : 'text-white bg-itta-black shadow-itta-black/20 hover:bg-itta-black/80 active:scale-95'
          }`}
        >
          <Plus className="w-4 h-4" />
          기록 추가하기
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 pb-16 sm:pb-32">
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
            onChangeCover={groupId && isViewer ? undefined : openGallery}
          />
        ))}
      </div>

      {/* 커버 변경 Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
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
              <DrawerClose className="sm:p-2 text-gray-400 cursor-pointer">
                <X className="w-6 h-6" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <GalleryDrawer
            groupId={groupId}
            month={activeMonthId!}
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
