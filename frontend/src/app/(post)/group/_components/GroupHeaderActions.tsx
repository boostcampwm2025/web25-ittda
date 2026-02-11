'use client';

import Back from '@/components/Back';
import DateSelectorDrawer from '@/components/DateSelectorDrawer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Popover } from '@/components/ui/popover';
import { useApiDelete } from '@/hooks/useApi';
import { useAuthStore } from '@/store/useAuthStore';
import {
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, MoreVertical, Settings, AlertCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import GroupInviteDrawer from './GroupInviteDrawer';
import { cn } from '@/lib/utils';
import { GroupMembersResponse } from '@/lib/types/groupResponse';
import { groupMyRoleOptions } from '@/lib/api/group';

interface GroupHeaderActionsProps {
  groupInfo: GroupMembersResponse;
  className?: string;
}
export default function GroupHeaderActions({
  groupInfo,
  className,
}: GroupHeaderActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const groupId = pathname.split('/')[2];
  const [showLeaveGroup, setShowLeaveGroup] = useState(false);

  const queryClient = useQueryClient();
  const { mutate: leaveGroup } = useApiDelete(
    `/api/groups/${groupId}/members/me`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['share'] });
        router.push('/shared');
      },
    },
  );

  // 현재 그룹의 role 조회
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(groupId),
    enabled: !!groupId,
  });

  const isViewer = roleData?.role === 'VIEWER';

  const handleLeaveGroup = () => {
    const { userId } = useAuthStore.getState();
    if (userId) {
      leaveGroup({ userId: userId });
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <Back />
      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isViewer && <GroupInviteDrawer groupId={groupId || 'gruop'} />}

        <DateSelectorDrawer
          className={className}
          groupId={groupId}
          dayRoute={`/group/${groupId}/detail`}
          monthRoute={`/group/${groupId}/month`}
          yearRoute={`/group/${groupId}/year`}
        />

        <Popover>
          <PopoverTrigger className="cursor-pointer p-2 sm:p-2.5 rounded-xl transition-colors active:scale-95 dark:bg-white/5 dark:text-gray-500 bg-gray-50 text-gray-400">
            <MoreVertical className="w-5 h-5" />
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="z-20 min-w-45 rounded-2xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-200 dark:bg-[#1E1E1E] dark:border-white/10 bg-white border-gray-100"
          >
            <button
              onClick={() => router.push(`/group/${groupId}/edit`)}
              className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors dark:text-gray-300 text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
              그룹 정보 수정
            </button>
            <PopoverClose
              onClick={() => {
                setShowLeaveGroup(true);
              }}
              className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-red-500 transition-colors dark:hover:bg-red-500/10 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              그룹 나가기
            </PopoverClose>
          </PopoverContent>
        </Popover>

        <Drawer open={showLeaveGroup} onOpenChange={setShowLeaveGroup}>
          <DrawerContent
            className={cn('px-4 sm:px-8 pt-4 pb-10 sm:pb-12', className)}
          >
            <DrawerHeader>
              <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1">
                  <DrawerTitle className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                    {`정말 '${groupInfo.groupName}' 그룹에서 나가시겠습니까?`}
                  </DrawerTitle>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">
                    그룹의 기록을 확인할 수 없게 됩니다.
                  </p>
                </div>
              </div>
            </DrawerHeader>

            <div className="flex gap-3 sm:gap-4">
              <DrawerClose className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-500 active:bg-gray-200">
                취소
              </DrawerClose>
              <DrawerClose
                onClick={handleLeaveGroup}
                className="cursor-pointer flex-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
              >
                그룹 나가기
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
