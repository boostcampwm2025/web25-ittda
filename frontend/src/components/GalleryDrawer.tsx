import { MonthRecord } from '@/lib/types/post';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { Dispatch, SetStateAction } from 'react';
import { DrawerClose } from './ui/drawer';

interface GalleryDrawerProps {
  recordPhotos: string[];
  months: MonthRecord[];
  setMonths: Dispatch<SetStateAction<MonthRecord[]>>;
  activeMonthId: string | null;
}

export default function GalleryDrawer({
  recordPhotos,
  months,
  setMonths,
  activeMonthId,
}: GalleryDrawerProps) {
  const handleSelectCover = (url: string) => {
    if (!activeMonthId) return;
    setMonths((prev) =>
      prev.map((m) => (m.id === activeMonthId ? { ...m, coverUrl: url } : m)),
    );
    // TODO: 서버로 커버 변경 요청 보내기
  };

  return (
    <div className="flex flex-col w-full">
      {recordPhotos.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl dark:bg-white/5 bg-white">
          <p className="font-bold text-[#10B981] text-xs">
            이달에 이미지가 포함된 기록이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[45vh] overflow-y-auto scrollbar-hide mb-8 min-h-0">
          {recordPhotos.map((url, idx) => {
            const isCurrent =
              months.find((m) => m.id === activeMonthId)?.coverUrl === url;

            return (
              <div key={idx} className="relative w-full aspect-square">
                <DrawerClose asChild>
                  <button
                    onClick={() => handleSelectCover(url)}
                    className={cn(
                      'absolute inset-0 w-full h-full cursor-pointer rounded-xl overflow-hidden transition-all active:scale-95 border-2',
                      isCurrent ? 'border-[#10B981]' : 'border-transparent',
                    )}
                  >
                    <Image
                      src={url}
                      className="object-cover"
                      alt=""
                      fill
                      sizes="(max-width: 640px) 33vw, 25vw"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-[#10B981]/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center shadow-lg">
                          <Check
                            className="w-4 h-4 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                </DrawerClose>
              </div>
            );
          })}
        </div>
      )}

      <DrawerClose className="cursor-pointer w-full py-4 rounded-2xl font-bold text-sm dark:bg-white/5 dark:text-gray-500 bg-itta-black text-white shrink-0">
        닫기
      </DrawerClose>
    </div>
  );
}
