'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useDeleteGroup } from '@/hooks/useGroupActions';
import { Group } from '@/lib/types/group';
import { AlertCircle, Trash2 } from 'lucide-react';

interface GroupDangerousZoneProps {
  groupName: Group['groupName'];
  groupId: string;
  className?: string;
}

export default function GroupDangerousZone({
  groupName,
  groupId,
  className,
}: GroupDangerousZoneProps) {
  const { mutate: deleteGroup } = useDeleteGroup(groupId, groupName);

  const handleDeleteGroup = () => {
    deleteGroup();
  };

  return (
    <section className="pt-6">
      <Drawer>
        <DrawerTrigger className="cursor-pointer w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed text-xs font-bold transition-all active:scale-95 dark:border-red-500/20 dark:text-red-500/60 dark:hover:bg-red-500/5 border-red-200 text-red-400 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
          그룹 삭제하기
        </DrawerTrigger>
        <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed">
          그룹 삭제 시 보관된 모든 기록과 사진이 영구히 삭제되며,
          <br />
          다른 멤버들도 더 이상 접근할 수 없게 됩니다.
        </p>
        <DrawerContent className={cn('px-8 pt-4 pb-12', className)}>
          <DrawerHeader>
            <div className="flex flex-col items-center text-center space-y-4 mb-10">
              <div className="w-16 h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                  {`정말 '${groupName}' 그룹을 삭제하시겠습니까?`}
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
              onClick={handleDeleteGroup}
              className="cursor-pointer flex-2 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
            >
              삭제하기
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
