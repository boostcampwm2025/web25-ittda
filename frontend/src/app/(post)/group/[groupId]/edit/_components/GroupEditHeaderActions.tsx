'use client';

import { useGroupEdit } from './GroupEditContext';
import Back from '@/components/Back';
import { useApiPatch } from '@/hooks/useApi';
import { GroupEditResponse } from '@/lib/types/groupResponse';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GroupEditHeaderActionsProps {
  groupId: string;
}

export default function GroupEditHeaderActions({
  groupId,
}: GroupEditHeaderActionsProps) {
  const { getEditData } = useGroupEdit();
  const queryClient = useQueryClient();

  const { mutate: updateGroup } = useApiPatch<GroupEditResponse>(
    `/api/groups/${groupId}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        toast.success('수정되었습니다.');
      },
    },
  );

  const handleSave = async () => {
    const editData = getEditData();

    updateGroup({
      groupName: editData.groupName,
      coverAssetId: editData.groupThumbnail?.assetId,
      postId: editData.groupThumbnail?.postId,
    });
  };

  return (
    <>
      <Back />
      <h2 className="text-sm font-bold dark:text-white text-itta-black">
        그룹 정보 수정
      </h2>
      <button
        onClick={handleSave}
        className="cursor-pointer font-bold text-sm text-[#10B981] active:scale-95 transition-all"
      >
        저장
      </button>
    </>
  );
}
