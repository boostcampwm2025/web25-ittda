'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGroupEdit } from './GroupEditContext';

interface GroupEditHeaderActionsProps {
  groupId: string;
}

export default function GroupEditHeaderActions({
  groupId,
}: GroupEditHeaderActionsProps) {
  const router = useRouter();
  const { getEditData } = useGroupEdit();

  const handleSave = async () => {
    const editData = getEditData();

    // FormData를 사용하여 파일과 데이터를 함께 전송
    const formData = new FormData();
    formData.append('groupName', editData.groupName);
    formData.append('members', JSON.stringify(editData.members));
    if (editData.groupThumbnail) {
      formData.append('groupThumbnail', editData.groupThumbnail);
    }

    // TODO: 서버로 그룹 정보 저장 요청 API 호출
    router.push(`/group/${groupId}`);
  };

  return (
    <>
      <button
        onClick={() => router.back()}
        className="cursor-pointer p-1 -ml-1 active:scale-90 transition-transform"
      >
        <ArrowLeft className="w-6 h-6 dark:text-white text-itta-black" />
      </button>
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
