'use client';

import SocialShareDrawer from '@/components/SocialShareDrawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { useEditPostDraft } from '@/hooks/useGrouprRecord';
import { useApiDelete, useApiPost } from '@/hooks/useApi';
import { ContentValue } from '@/lib/types/recordField';
import { RecordPreview } from '@/lib/types/recordResponse';
import { getSingleBlockValue } from '@/lib/utils/record';
import { Link2, Link2Off, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isImageBlock } from '@/lib/utils/mediaResolver';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupMyRoleOptions } from '@/lib/api/group';
import { RecordDetailResponse } from '@/lib/types/record';

interface DailyDetailRecordActionsProps {
  record: RecordPreview;
  onDeleteClick: (record: RecordPreview) => void;
}

export default function DailyDetailRecordActions({
  record,
  onDeleteClick,
}: DailyDetailRecordActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const cachedRecord = queryClient.getQueryData<RecordDetailResponse>(['record', record.postId]);
  const [shareToken, setShareToken] = useState<string | null>(cachedRecord?.shareToken ?? null);

  const { mutate: createShareLink, isPending: isCreatingShare } = useApiPost<{
    shareToken: string;
    shareUrl: string;
  }>(`/api/posts/${record.postId}/share`, {
    onSuccess: (res) => {
      if (res.data?.shareToken) {
        setShareToken(res.data.shareToken);
        setShareOpen(true);
        queryClient.invalidateQueries({ queryKey: ['record', record.postId] });
      }
    },
    onError: () => toast.error('공유 링크 생성에 실패했습니다.'),
  });

  const { mutate: revokeShareLink, isPending: isRevokingShare } = useApiDelete(
    `/api/posts/${record.postId}/share`,
    {
      onSuccess: () => {
        setShareToken(null);
        toast.success('공유 링크가 해제되었어요.');
        queryClient.invalidateQueries({ queryKey: ['record', record.postId] });
      },
      onError: () => toast.error('공유 링크 해제에 실패했습니다.'),
    },
  );

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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shareToken) {
      setShareOpen(true);
    } else {
      createShareLink({});
    }
  };

  const handleEdit = async (record: RecordPreview, e: React.MouseEvent) => {
    e.stopPropagation();

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
    onDeleteClick(record);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger
          disabled={isViewer}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer p-1 active:scale-90 transition-transform text-gray-400"
        >
          <MoreHorizontal className="w-4 h-4" />
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
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
          {shareToken ? (
            <PopoverClose
              onClick={() => revokeShareLink({})}
              disabled={isRevokingShare}
              className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
            >
              <Link2Off className="w-3.5 h-3.5" />
              공유 링크 해제
            </PopoverClose>
          ) : (
            <PopoverClose
              onClick={() => createShareLink({})}
              disabled={isCreatingShare}
              className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              공유 링크 생성
            </PopoverClose>
          )}
          <PopoverClose
            onClick={(e) => handleEdit(record, e)}
            className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold transition-colors dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
          >
            수정하기
          </PopoverClose>
          <div className="h-px mx-3 my-1 dark:bg-white/5 bg-gray-100" />
          <PopoverClose
            onClick={handleDeleteClick}
            className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold text-red-500 transition-colors dark:hover:bg-red-500/10 hover:bg-red-50"
          >
            삭제하기
          </PopoverClose>
        </PopoverContent>
      </Popover>
      <SocialShareDrawer
        path={shareToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}` : currentUrl}
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
