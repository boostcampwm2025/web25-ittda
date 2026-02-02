'use client';

import { useGroupEdit } from './GroupEditContext';
import Back from '@/components/Back';
import { useApiPatch } from '@/hooks/useApi';
import {
  GroupEditResponse,
  GroupProfileCoverResponse,
} from '@/lib/types/groupResponse';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';

interface GroupEditHeaderActionsProps {
  groupId: string;
}

export default function GroupEditHeaderActions({
  groupId,
}: GroupEditHeaderActionsProps) {
  const { getEditData } = useGroupEdit();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const { mutateAsync: updateGroup } = useApiPatch<GroupEditResponse>(
    `/api/groups/${groupId}`,
  );

  const { mutateAsync: updateGroupCover } =
    useApiPatch<GroupProfileCoverResponse>(`/api/groups/${groupId}/cover`);

  const handleSave = async () => {
    const editData = getEditData();
    const tasks = [];
    setIsPending(true);

    try {
      tasks.push(updateGroup({ name: editData.groupName }));

      if (editData.groupThumbnail) {
        tasks.push(
          updateGroupCover({
            assetId: editData.groupThumbnail.assetId,
            sourcePostId: editData.groupThumbnail.postId,
          }),
        );
      }

      await Promise.all(tasks);
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('수정되었습니다.');
    } catch (error) {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'group-info',
          operation: 'update-group-info',
        },
        extra: {
          groupName: editData.groupName,
          assetId: editData.groupThumbnail,
        },
      });
      console.error('update failed', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Back />
      <h2 className="text-sm font-bold dark:text-white text-itta-black">
        그룹 정보 수정
      </h2>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="cursor-pointer font-bold text-sm text-[#10B981] active:scale-95 transition-all"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
      </button>
    </>
  );
}
