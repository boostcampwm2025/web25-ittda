'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useApiPatch } from '@/hooks/useApi';
import { setCookie } from '@/lib/utils/cookie';
import AssetImage from '@/components/AssetImage';
import type { AnnouncementData } from './AnnouncementModal';

interface Props {
  announcement: AnnouncementData;
}

export default function AnnouncementModalClient({ announcement }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const userId = useAuthStore((state) => state.userId);

  const { mutate: updateSettings } = useApiPatch<
    unknown,
    { settings: Record<string, unknown> }
  >('/api/me/settings');

  const handleClose = () => {
    setIsOpen(false);
    if (userId) {
      updateSettings({ settings: { dismissedAnnouncementId: announcement.id } });
    } else {
      setCookie('dismissed-announcement-id', announcement.id, { days: 30 });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-announcement-modal
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* 모달 */}
          <motion.div
            className="relative w-full max-w-sm bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* 이미지 */}
            {announcement.imageUrl && (
              <div className="relative w-full aspect-video">
                <AssetImage
                  assetId={announcement.imageUrl}
                  alt={announcement.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 384px) 100vw, 384px"
                />
              </div>
            )}

            {/* 텍스트 영역 */}
            <div className="p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                {announcement.title}
              </h2>
              {announcement.content && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {announcement.content}
                </p>
              )}
            </div>

            {/* 닫기 버튼 (하단) */}
            <div className="px-5 pb-5">
              <button
                onClick={handleClose}
                className="w-full h-11 rounded-xl bg-itta-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
