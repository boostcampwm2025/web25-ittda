'use client';

import Back from '@/components/Back';
import SocialShareDrawer from '@/components/SocialShareDrawer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Popover } from '@/components/ui/popover';
import { useApiDelete } from '@/hooks/useApi';
import { CACHE_TAGS } from '@/lib/api/cache';
import { invalidateCache } from '@/lib/api/cache-actions';
import { RecordDetailResponse } from '@/lib/types/record';
import { ApiError } from '@/lib/utils/errorHandler';
import { useAuthStore } from '@/store/useAuthStore';
import {
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RecordDetailHeaderActionsProps {
  record: RecordDetailResponse;
}

export default function RecordDetailHeaderActions({
  record,
}: RecordDetailHeaderActionsProps) {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { userId } = useAuthStore();

  const textBlock = record.blocks.find((block) => block.type === 'TEXT');
  const content =
    textBlock && 'text' in textBlock.value ? textBlock.value.text : '';

  // 마운트 시점에 window 주소 가져오기
  useEffect(() => {
    requestAnimationFrame(() => {
      setCurrentUrl(window.location.href);
    });
  }, []);

  // TEXT 타입 블록에서 내용 추출
  const shareData = {
    title: record.title,
    text: content,
    url: currentUrl,
  };

  const queryClient = useQueryClient();
  const { mutate: deleteRecord } = useApiDelete(`/api/posts/${record.id}`, {
    onSuccess: () => {
      invalidateCache(CACHE_TAGS.RECORDS);
      toast.success('기록이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['records'] });

      setTimeout(() => {
        router.back();
      }, 1000);
    },
    onError: (error: ApiError) => {
      if (error.code && error.code === 'NOT_FOUND') {
        router.back();
      }
    },
  });

  const handleEdit = () => {
    // router.push('/add', {
    //   state: {
    //     ...record,
    //     selectedEmotion: { emoji: record.emotion, label: record.emotionLabel },
    //     selectedTags: record.tags,
    //     selectedRating: record.rating,
    //     selectedLocation: record.location,
    //     attachedPhotos: record.image ? [record.image] : [],
    //     selectedMedia: record.media,
    //     tableData: record.table,
    //     isEdit: true,
    //     groupId: groupId,
    //   },
    // });
  };

  const handleShare = async () => {
    if (!navigator.share) {
      setShareOpen(true);
      return;
    }

    try {
      await navigator.share(shareData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (
        err.name === 'TypeError' ||
        (err.message && err.message.toLowerCase().includes('url'))
      ) {
        try {
          await navigator.share({
            title: record.title,
            text: content,
          });
        } catch (innerErr) {
          console.error('Share failed even without URL:', innerErr);
        }
      } else if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const handleDelete = () => {
    deleteRecord(userId ? { userId } : {});
  };

  return (
    <>
      <Back />
      <div className="relative">
        <Popover>
          <PopoverTrigger className="cursor-pointer p-1 active:scale-90 transition-transform text-gray-400">
            <MoreHorizontal className="w-6 h-6" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="z-20 min-w-45 rounded-2xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-200 dark:bg-[#1E1E1E] dark:border-white/10 bg-white border-gray-100"
          >
            <PopoverClose
              onClick={handleShare}
              className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold transition-colors dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
            >
              공유하기
            </PopoverClose>
            <PopoverClose
              className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold transition-colors dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
              onClick={handleEdit}
            >
              수정하기
            </PopoverClose>
            <div className="h-px mx-3 my-1 dark:bg-white/5 bg-gray-100" />
            <PopoverClose
              asChild
              className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold text-red-500 transition-colors dark:hover:bg-red-500/10 hover:bg-red-50"
            >
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                }}
              >
                삭제하기
              </button>
            </PopoverClose>
          </PopoverContent>
        </Popover>

        <Drawer open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DrawerContent className="px-8 pt-4 pb-12">
            <DrawerHeader>
              <div className="flex flex-col items-center text-center space-y-4 mb-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                    정말 삭제할까요?
                  </DrawerTitle>
                  <p className="text-sm text-gray-400 font-medium">
                    삭제된 기록은 다시 복구할 수 없습니다.
                  </p>
                </div>
              </div>
            </DrawerHeader>

            <div className="flex gap-4">
              <DrawerClose className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-500 active:bg-gray-200">
                취소
              </DrawerClose>
              <DrawerClose
                onClick={handleDelete}
                className="flex-2 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
              >
                삭제하기
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <SocialShareDrawer
        path={shareData.url}
        title={shareData.title}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </>
  );
}
