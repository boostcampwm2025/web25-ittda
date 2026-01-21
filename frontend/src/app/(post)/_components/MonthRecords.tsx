'use client';

import { MonthRecord } from '@/lib/types/record';
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
import { BookOpen, Plus, X } from 'lucide-react';

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

interface MonthRecordsProps {
  monthRecords: MonthRecord[];
  cardRoute: string;
}

export default function MonthRecords({
  monthRecords,
  cardRoute,
}: MonthRecordsProps) {
  const router = useRouter();
  const [months, setMonths] = useState(monthRecords);
  const [activeMonthId, setActiveMonthId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openGallery = (monthId: string) => {
    setActiveMonthId(monthId);
    setIsDrawerOpen(true);
  };

  // 현재 선택된 월의 사진들 가져오기
  const activeMonth = months.find((m) => m.id === activeMonthId);
  // TODO: 서버로부터 사진 목록 받아오기(activeMonth를 키 값으로 가져오기)
  const recordPhotos = recordPhotosData || [];

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
            recordPhotos={recordPhotos}
            value={months}
            setValue={setMonths}
            activeId={activeMonthId}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
