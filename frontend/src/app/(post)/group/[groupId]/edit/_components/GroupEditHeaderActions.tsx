'use client';

import Back from '@/components/Back';

interface GroupEditHeaderActionsProps {
  groupId: string;
}

export default function GroupEditHeaderActions({
  groupId,
}: GroupEditHeaderActionsProps) {
  return (
    <>
      <Back fallback={`/group/${groupId}`} />
      <h2 className="text-[13px] sm:text-sm font-bold dark:text-white text-itta-black">
        그룹 정보 수정
      </h2>
      <div className="w-4" />
    </>
  );
}
