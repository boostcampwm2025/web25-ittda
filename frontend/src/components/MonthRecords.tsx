'use client';

import { MonthRecord } from '@/lib/types/post';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RecordCard } from '@/components/ui/RecordCard';
import GalleryDrawer from '@/components/GalleryDrawer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { X } from 'lucide-react';

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
}

export default function MonthRecords({ monthRecords }: MonthRecordsProps) {
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

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {months.map((m) => (
          <RecordCard
            key={m.id}
            id={m.id}
            name={m.name}
            count={m.count}
            latestTitle={m.latestTitle}
            latestLocation={m.latestLocation}
            coverUrl={m.coverUrl}
            onClick={() => router.push(`/my/month/${m.id}`)}
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
