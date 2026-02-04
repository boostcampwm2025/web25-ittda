'use client';

import SocialShareDrawer from '@/components/SocialShareDrawer';
import { useEditPostDraft } from '@/hooks/useGrouprRecord';
import { ContentValue } from '@/lib/types/recordField';
import { RecordPreview } from '@/lib/types/recordResponse';
import { getSingleBlockValue } from '@/lib/utils/record';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isImageBlock } from '@/lib/utils/mediaResolver';
import { useQuery } from '@tanstack/react-query';
import { groupMyRoleOptions } from '@/lib/api/group';

interface DailyDetailRecordActionsProps {
  record: RecordPreview;
  onDeleteClick: (record: RecordPreview) => void;
}

export default function DailyDetailRecordActions({
  record,
  onDeleteClick,
}: DailyDetailRecordActionsProps) {
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const { mutateAsync: startGroupEdit } = useEditPostDraft(
    record.groupId || '',
    record.postId,
  );

  // 그룹 게시글인 경우 권한 확인
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(record.groupId!),
    enabled: !!record.groupId,
  });

  const isViewer = roleData?.role === 'VIEWER';

  const content = getSingleBlockValue<ContentValue>(record, 'TEXT')?.text || '';
  const image = record.blocks.find(isImageBlock);

  // 마운트 시점에 window 주소 가져오기
  useEffect(() => {
    requestAnimationFrame(() => {
      setCurrentUrl(`${window.location.origin}/record/${record.postId}`);
    });
  }, [record.postId]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setShareOpen(true);
  };

  const handleEdit = async (record: RecordPreview, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);

    if (record.scope === 'ME') {
      router.push(`/add?mode=edit&postId=${record.postId}`);
    } else {
      if (!record.groupId) {
        toast.error('그룹 정보를 찾을 수 없습니다.');
        return;
      }

      const response = await startGroupEdit({});

      if (response.success && response.data?.redirectUrl) {
        router.push(
          `${response.data.redirectUrl}?mode=edit&postId=${record.postId}`,
        );
      } else {
        toast.error('편집 세션을 시작할 수 없습니다.');
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    onDeleteClick(record);
  };

  return (
    <>
      <button
        disabled={isViewer}
        onClick={(e) => {
          e.stopPropagation();
          if (!isViewer) {
            setActiveMenuId(
              activeMenuId === record.postId ? null : record.postId,
            );
          }
        }}
        className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 transition-colors active:scale-90"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {activeMenuId === record.postId && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setActiveMenuId(null)}
          />
          <div className="absolute right-0 top-8 z-30 min-w-27.5 rounded-2xl shadow-2xl border p-1 animate-in fade-in zoom-in-95 duration-200 dark:bg-[#2A2A2A] dark:border-white/10 bg-white border-gray-100">
            <button
              onClick={handleShare}
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
      <SocialShareDrawer
        path={currentUrl}
        title={record.title}
        open={shareOpen}
        onOpenChange={setShareOpen}
        record={{
          id: record.postId,
          title: record.title,
          content,
          image: image?.value.mediaIds?.[0] ?? null,
        }}
      />
    </>
  );
}
