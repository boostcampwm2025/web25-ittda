'use client';

import { MemoryRecord } from '@/lib/types/post';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DailyDetailRecordActionsProps {
  record: MemoryRecord;
  onDeleteClick: (record: MemoryRecord) => void;
}

export default function DailyDetailRecordActions({
  record,
  onDeleteClick,
}: DailyDetailRecordActionsProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const router = useRouter();

  const handleShare = async (record: MemoryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (!navigator.share) {
      // TODO: 공유하기 기능 지원하지 않는다는 toast 필요
      // alert('공유하기 기능이 지원되지 않는 브라우저입니다.');
      return;
    }

    try {
      await navigator.share({
        title: record.title,
        text: record.data.content,
        url: window.location.href,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.share({
            title: record.title,
            text: record.data.content,
          });
        } catch (innerErr) {
          console.error('Share failed', innerErr);
        }
      }
    }
  };

  const handleEdit = (record: MemoryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    // router.push('/add', {
    //   state: {
    //     ...record,
    //     selectedEmotion: record.data.emotion,
    //     selectedTags: record.data.tags,
    //     selectedRating: record.data.rating.value,
    //     selectedLocation: record.data.location,
    //     attachedPhotos: record.data.photos,
    //     selectedMedia: record.data.media,
    //     tableData: record.data.table,
    //     isEdit: true,
    //     groupId: groupId,
    //   },
    // });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    onDeleteClick(record);
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveMenuId(activeMenuId === record.id ? null : record.id);
        }}
        className="cursor-pointer p-1 text-gray-300 hover:text-gray-500 transition-colors active:scale-90"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {activeMenuId === record.id && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setActiveMenuId(null)}
          />
          <div className="absolute right-0 top-8 z-30 min-w-27.5 rounded-2xl shadow-2xl border p-1 animate-in fade-in zoom-in-95 duration-200 dark:bg-[#2A2A2A] dark:border-white/10 bg-white border-gray-100">
            <button
              onClick={(e) => handleShare(record, e)}
              className="cursor-pointer w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-colors dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
            >
              공유하기
            </button>
            <button
              onClick={(e) => handleEdit(record, e)}
              className="cursor-pointer w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-colors dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
            >
              수정하기
            </button>
            <div className="h-px mx-3 my-1 dark:bg-white/5 bg-gray-100" />
            <button
              onClick={handleDeleteClick}
              className="cursor-pointer w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold text-red-500 transition-colors dark:hover:bg-red-500/10 hover:bg-red-50"
            >
              삭제하기
            </button>
          </div>
        </>
      )}
    </>
  );
}
