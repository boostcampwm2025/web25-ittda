'use client';

import { Trash2, X, Plus, Info, CheckCircle2, Loader2 } from 'lucide-react';
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
  isUploading?: boolean;
  pendingPreviewUrls?: string[];
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
  isUploading = false,
  pendingPreviewUrls = [],
}: PhotoDrawerProps) {
  const mediaIds = photos.mediaIds || [];
  const tempUrls = photos.tempUrls || [];
  const { data: resolvedData } = useMediaResolveMulti(mediaIds, draftId);

  const urlMap = new Map(
    resolvedData?.items.map((item) => [item.mediaId, item.url]),
  );

  // 총 사진 수: mediaIds 기준 (로딩 중에도 개수 유지) + 업로드 중인 미리보기
  const totalCount =
    (mediaIds.length > 0 ? mediaIds.length : tempUrls.length) +
    pendingPreviewUrls.length;

  // tempUrls는 mediaIds 뒤쪽(tail)에 추가된 새 사진의 미리보기와 대응된다.
  // (기록 수정 등 기존 mediaIds에는 대응하는 tempUrl이 없을 수 있음)
  const tempUrlOffset = mediaIds.length - tempUrls.length;

  // 각 슬롯의 URL(null이면 로딩 스켈레톤): tempUrl 우선, 없으면 resolved URL
  // 업로드 중인 미리보기는 맨 뒤에 추가 (서버 반영 전 자기 자신에게만 표시)
  const photoSlots = [
    ...(mediaIds.length > 0
      ? mediaIds.map((id, i) => ({
          key: id,
          url:
            (i >= tempUrlOffset ? tempUrls[i - tempUrlOffset] : undefined) ||
            urlMap.get(id) ||
            null,
          isPending: false,
        }))
      : tempUrls.map((url, i) => ({
          key: `temp-${i}`,
          url,
          isPending: false,
        }))),
    ...pendingPreviewUrls.map((url, i) => ({
      key: `pending-${i}`,
      url,
      isPending: true,
    })),
  ];
  return (
    <Drawer
      open={true}
      onOpenChange={(open) => !open && !isUploading && onClose()}
      dismissible={!isUploading}
    >
      <DrawerContent className="h-[80vh] flex flex-col outline-none">
        <div className="w-full px-6 pt-4 pb-10 flex flex-col h-full overflow-hidden">
          <DrawerHeader className="px-0 items-start text-left flex flex-row justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                SELECT PHOTOS
              </span>
              <DrawerTitle className="text-lg font-bold">
                사진 관리 ({totalCount})
              </DrawerTitle>
            </div>
            {!draftId && onEditMetadata && totalCount > 0 && (
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
                disabled={isUploading}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-[#10B981] bg-[#10B981]/5 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Plus size={24} />
                )}
                <span className="text-[10px] font-bold">
                  {isUploading ? '업로드 중' : '사진 추가'}
                </span>
              </button>

              {photoSlots.map(({ key, url, isPending }, idx) => {
                const appliedFields = url ? appliedMetadata[url] : undefined;
                const isMetadataApplied =
                  appliedFields &&
                  (appliedFields.date ||
                    appliedFields.time ||
                    appliedFields.location);
                return (
                  <div
                    key={`${key}-${idx}`}
                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-sm group bg-gray-100 dark:bg-white/5 ${
                      isMetadataApplied ? 'ring-4 ring-[#10B981]' : ''
                    }`}
                  >
                    {url ? (
                      <Image
                        src={url}
                        width={253}
                        height={253}
                        alt={`첨부사진 ${idx + 1}`}
                        className="w-full h-full object-cover rounded-2xl"
                        unoptimized={true}
                        style={{ imageOrientation: 'from-image' }}
                      />
                    ) : (
                      // URL 아직 로딩 중 — 스켈레톤
                      <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-white/20 rounded-2xl" />
                    )}
                    {isPending && (
                      // 업로드 진행 중 — 자기 자신에게만 보이는 미리보기
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                        <Loader2 size={20} className="animate-spin text-white" />
                      </div>
                    )}
                    {isMetadataApplied && (
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-1 bg-[#10B981] rounded-full">
                        <CheckCircle2 size={12} className="text-white" />
                        <span className="text-[10px] font-bold text-white">
                          메타데이터
                        </span>
                      </div>
                    )}
                    {!isPending && (
                      <button
                        onClick={() => onRemovePhoto(idx)}
                        disabled={isUploading}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform disabled:opacity-50 disabled:active:scale-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 shrink-0">
            {totalCount > 0 && (
              <button
                onClick={() => {
                  onRemoveAll();
                  onClose();
                }}
                disabled={isUploading}
                className="w-full py-3 flex items-center justify-center gap-2 text-rose-500 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-500/5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                전체 삭제하기
              </button>
            )}
            {isUploading ? (
              <div className="w-full py-4 rounded-xl font-bold text-sm bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed">
                <Loader2 size={16} className="animate-spin" />
                이미지 업로드 중...
              </div>
            ) : (
              <DrawerClose className="w-full py-4 rounded-xl font-bold text-sm bg-itta-black text-white dark:bg-white dark:text-black shadow-xl active:scale-95 transition-all">
                완료
              </DrawerClose>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
