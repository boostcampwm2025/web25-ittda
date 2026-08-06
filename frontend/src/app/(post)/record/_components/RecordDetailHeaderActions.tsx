'use client';

import Back from '@/components/Back';
import SocialShareDrawer from '@/components/SocialShareDrawer';
import GroupShareDrawer from '@/components/GroupShareDrawer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useApiDelete, useApiPost } from '@/hooks/useApi';
import { useEditPostDraft } from '@/hooks/useGrouprRecord';
import { ImageValue, RecordDetailResponse } from '@/lib/types/record';
import { ApiError } from '@/lib/utils/errorHandler';
import { useAuthStore } from '@/store/useAuthStore';
import { PopoverClose } from '@radix-ui/react-popover';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Link2, Link2Off, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { groupListOptions, groupMyRoleOptions } from '@/lib/api/group';
import { postGroupShareOptions } from '@/lib/api/records';
import { refreshSharedData } from '@/lib/actions/revalidate';

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
  const [groupShareOpen, setGroupShareOpen] = useState(false);
  const shareToken = record.shareToken ?? null;
  const { userId } = useAuthStore();

  const { data: shareableGroups = [] } = useQuery({
    ...groupListOptions(),
    enabled: groupShareOpen,
  });
  const { data: sharedGroups = [] } = useQuery({
    ...postGroupShareOptions(record.id),
    enabled: groupShareOpen,
  });

  const { mutate: createShareLink, isPending: isCreatingShare } = useApiPost<{
    shareToken: string;
    shareUrl: string;
  }>(`/api/posts/${record.id}/share`, {
    onSuccess: (res) => {
      if (res.data?.shareToken) {
        setShareOpen(true);
        queryClient.invalidateQueries({ queryKey: ['record', record.id] });
      }
    },
    onError: () => toast.error('공유 링크 생성에 실패했습니다.'),
  });

  const { mutate: revokeShareLink, isPending: isRevokingShare } = useApiDelete(
    `/api/posts/${record.id}/share`,
    {
      onSuccess: () => {
        toast.success('공유 링크가 해제되었어요.');
        queryClient.invalidateQueries({ queryKey: ['record', record.id] });
      },
      onError: () => toast.error('공유 링크 해제에 실패했습니다.'),
    },
  );
  const { mutateAsync: startGroupEdit } = useEditPostDraft(
    record.groupId || '',
    record.id,
  );

  // 그룹 게시글인 경우 권한 확인
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(record.groupId!),
    enabled: !!record.groupId,
  });

  const isViewer = roleData?.role === 'VIEWER';
  // 공유받은 개인 글은 그룹원도 조회는 가능하지만, 원작성자만 공유/수정/삭제할 수 있다.
  const isPersonalNonOwner =
    record.scope === 'PERSONAL' && record.permission !== 'OWNER';

  const textBlock = record.blocks.find((block) => block.type === 'TEXT');
  const content =
    textBlock && 'text' in textBlock.value ? textBlock.value.text : '';
  const image = record.blocks.find((block) => block.type === 'IMAGE')
    ?.value as ImageValue;
  useEffect(() => {
    requestAnimationFrame(() => {
      setCurrentUrl(`${window.location.origin}/record/${record.id}`);
    });
  }, [record.id]);

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`
    : currentUrl;

  // TEXT 타입 블록에서 내용 추출
  const shareData = {
    id: record.id,
    title: record.title,
    text: content,
    url: shareUrl,
  };

  const queryClient = useQueryClient();
  const { mutate: deleteRecord } = useApiDelete(`/api/posts/${record.id}`, {
    onSuccess: async () => {
      toast.success('기록이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['my', 'records'] });

      if (record.groupId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['group', record.groupId, 'records'],
          }),
          queryClient.invalidateQueries({
            queryKey: ['shared'],
          }),
          refreshSharedData(),
        ]);
      }

      router.back();
    },
    onError: (error: ApiError) => {
      if (error.code && error.code === 'NOT_FOUND') {
        router.back();
      }
    },
  });

  const handleEdit = async () => {
    if (record.scope === 'PERSONAL') {
      router.push(`/add?mode=edit&postId=${record.id}`);
    } else {
      if (!record.groupId) {
        toast.error('그룹 정보를 찾을 수 없습니다.');
        return;
      }

      const response = await startGroupEdit({});

      if (response.success && response.data?.redirectUrl) {
        router.push(
          `${response.data.redirectUrl}?mode=edit&postId=${record.id}`,
        );
      } else {
        toast.error('편집 세션을 시작할 수 없습니다.');
      }
    }
  };

  const handleShare = () => {
    if (shareToken) {
      setShareOpen(true);
    } else {
      createShareLink({});
    }
  };

  const handleDelete = () => {
    deleteRecord(userId ? { userId } : {});
  };

  return (
    <>
      <Back fallback="/" />
      <div className="relative">
        <Popover>
          <PopoverTrigger
            disabled={isViewer || isPersonalNonOwner}
            className={`p-1 transition-transform text-gray-400 ${
              isViewer || isPersonalNonOwner
                ? 'opacity-40 cursor-not-allowed'
                : 'cursor-pointer active:scale-90'
            }`}
          >
            <MoreHorizontal className="w-6 h-6" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="min-w-45 rounded-2xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-200 dark:bg-[#1E1E1E] dark:border-white/10 bg-white border-gray-100"
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
            {record.scope === 'PERSONAL' && (
              <PopoverClose
                onClick={() => setGroupShareOpen(true)}
                className="cursor-pointer w-full text-left px-5 py-3.5 rounded-xl text-xs font-semibold transition-colors dark:text-gray-300 dark:hover:bg-white/5 text-gray-600 hover:bg-gray-50"
              >
                그룹에 공유
              </PopoverClose>
            )}
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
        record={{
          id: record.id,
          title: record.title,
          content,
          image: image?.mediaIds?.[0] ?? null,
        }}
      />

      {record.scope === 'PERSONAL' && (
        <GroupShareDrawer
          postId={record.id}
          open={groupShareOpen}
          onOpenChange={setGroupShareOpen}
          groups={shareableGroups}
          initialSelectedGroupIds={sharedGroups.map((g) => g.groupId)}
        />
      )}
    </>
  );
}
