'use client';

import { Trash2, X, Plus } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import Image from 'next/image';
import { PhotoValue } from '@/lib/types/recordField';

interface PhotoDrawerProps {
  onClose: () => void;
  photos: PhotoValue;
  onUploadClick: () => void;
  onRemovePhoto: (index: number) => void;
  onRemoveAll: () => void;
}

export default function PhotoDrawer({
  onClose,
  photos,
  onUploadClick,
  onRemovePhoto,
  onRemoveAll,
}: PhotoDrawerProps) {
  const allPhotos = [...(photos.mediaIds || []), ...(photos.tempUrls || [])];

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[80vh] flex flex-col outline-none">
        <div className="w-full px-6 pt-4 pb-10 flex flex-col h-full overflow-hidden">
          <DrawerHeader className="px-0 items-start text-left">
            <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
              사진 관리 ({allPhotos.length})
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 py-2">
              <button
                onClick={onUploadClick}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-[#10B981] bg-[#10B981]/5 active:scale-95 transition-all"
              >
                <Plus size={24} />
                <span className="text-[10px] font-bold">사진 추가</span>
              </button>

              {allPhotos.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group bg-gray-100 dark:bg-white/5"
                >
                  <Image
                    src={url}
                    fill
                    alt={`첨부사진 ${url}`}
                    className="object-cover"
                  />
                  <button
                    onClick={() => onRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 flex-shrink-0">
            {allPhotos.length > 0 && (
              <button
                onClick={() => {
                  onRemoveAll();
                  onClose();
                }}
                className="w-full py-3 flex items-center justify-center gap-2 text-rose-500 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-500/5 rounded-xl transition-colors"
              >
                <Trash2 size={14} />
                전체 삭제하기
              </button>
            )}
            <DrawerClose className="w-full py-4 rounded-xl font-bold text-sm bg-itta-black text-white dark:bg-white dark:text-black shadow-xl active:scale-95 transition-all">
              완료
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
