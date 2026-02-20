'use client';

import { Trash2, X, Plus, Info, CheckCircle2 } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import Image from 'next/image';
import { PhotoValue } from '@/lib/types/recordField';
import { useMediaResolveMulti } from '@/hooks/useMediaResolve';

interface PhotoDrawerProps {
  onClose: () => void;
  photos: PhotoValue;
  onUploadClick: () => void;
  onRemovePhoto: (index: number) => void;
  onRemoveAll: () => void;
  onEditMetadata?: () => void;
  appliedMetadata?: {
    [imageUrl: string]: {
      date: boolean;
      time: boolean;
      location: boolean;
    };
  };
  draftId?: string;
}

export default function PhotoDrawer({
  onClose,
  photos,
  onUploadClick,
  onRemovePhoto,
  onRemoveAll,
  onEditMetadata,
  appliedMetadata = {},
  draftId,
}: PhotoDrawerProps) {
  const mediaIds = photos.mediaIds || [];
  const { data: resolvedData } = useMediaResolveMulti(mediaIds, draftId);

  // resolve 된 url
  const urlMap = new Map(
    resolvedData?.items.map((item) => [item.mediaId, item.url]),
  );

  // 전체 사진
  const allPhotos = [
    ...mediaIds.map((id) => urlMap.get(id) || id),
    ...(photos.tempUrls || []),
  ];
  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[80vh] flex flex-col outline-none">
        <div className="w-full px-6 pt-4 pb-10 flex flex-col h-full overflow-hidden">
          <DrawerHeader className="px-0 items-start text-left flex flex-row justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                SELECT PHOTOS
              </span>
              <DrawerTitle className="text-lg font-bold">
                사진 관리 ({allPhotos.length})
              </DrawerTitle>
            </div>
            {!draftId && onEditMetadata && allPhotos.length > 0 && (
              <button
                onClick={onEditMetadata}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/20 active:scale-95 transition-all"
              >
                <Info size={14} />
                메타데이터
              </button>
            )}
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 py-2">
              <button
                onClick={onUploadClick}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-[#10B981] bg-[#10B981]/5 active:scale-95 transition-all"
              >
                <Plus size={24} />
                <span className="text-[10px] font-bold">사진 추가</span>
              </button>

              {allPhotos.map((url, idx) => {
                // 해당 이미지에 적용된 필드가 하나라도 있는지 확인
                const appliedFields = appliedMetadata[url];
                const isMetadataApplied =
                  appliedFields &&
                  (appliedFields.date ||
                    appliedFields.time ||
                    appliedFields.location);
                return (
                  <div
                    key={`${url}-${idx}`}
                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-sm group bg-gray-100 dark:bg-white/5 ${
                      isMetadataApplied ? 'ring-4 ring-[#10B981]' : ''
                    }`}
                  >
                    <Image
                      src={url}
                      width={253}
                      height={253}
                      alt={`첨부사진 ${url}`}
                      className="w-full h-full object-cover rounded-2xl"
                      unoptimized={true}
                    />
                    {isMetadataApplied && (
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-1 bg-[#10B981] rounded-full">
                        <CheckCircle2 size={12} className="text-white" />
                        <span className="text-[10px] font-bold text-white">
                          메타데이터
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => onRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 shrink-0">
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
