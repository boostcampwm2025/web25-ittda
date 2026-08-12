'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { X, Users, Check, Share2 } from 'lucide-react';
import { GroupSummary } from '@/lib/types/recordResponse';
import { PostGroupShare } from '@/lib/api/records';
import { useApiDelete, useApiPost } from '@/hooks/useApi';
import AssetImage from './AssetImage';
import { randomBaseImage } from '@/lib/image';

interface GroupShareDrawerProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: GroupSummary[];
  initialSelectedGroupIds: string[];
}

export default function GroupShareDrawer({
  postId,
  open,
  onOpenChange,
  groups,
  initialSelectedGroupIds,
}: GroupShareDrawerProps) {
  const [selected, setSelected] = useState<string[]>(initialSelectedGroupIds);
  const queryClient = useQueryClient();

  // 드로어가 열려있는 동안 서버에서 불러온 현재 공유 상태로 동기화한다.
  // open 전환 시점에는 아직 조회(enabled: open)가 끝나지 않아
  // initialSelectedGroupIds가 빈 배열일 수 있어서, open만이 아니라
  // initialSelectedGroupIds가 실제로 바뀌는 시점(=조회 완료)에도 반응해야
  // 뒤늦게 도착한 데이터로 체크 상태가 갱신된다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setSelected(initialSelectedGroupIds);
  }, [open, initialSelectedGroupIds]);

  const invalidateAfterChange = () => {
    queryClient.invalidateQueries({
      queryKey: ['posts', postId, 'group-shares'],
    });
    queryClient.invalidateQueries({ queryKey: ['record', postId] });
  };

  // 원문 영어 에러 메시지가 전역 토스트로 그대로 뜨지 않도록 막고,
  // 아래 handleConfirm의 catch에서 사용자 친화적인 메시지로 대신 띄운다.
  const { mutateAsync: shareToGroups, isPending: isSharing } = useApiPost<
    PostGroupShare[],
    { groupIds: string[] }
  >(`/api/posts/${postId}/group-shares`, { meta: { silent: true } });

  const { mutateAsync: unshareFromGroup, isPending: isUnsharing } =
    useApiDelete<void, { groupId: string }>(
      (variables) => `/api/posts/${postId}/group-shares/${variables.groupId}`,
      { meta: { silent: true } },
    );

  const toggleGroup = (groupId: string) => {
    setSelected((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const isPending = isSharing || isUnsharing;

  const handleConfirm = async () => {
    const newlyShared = selected.filter(
      (id) => !initialSelectedGroupIds.includes(id),
    );
    const newlyUnshared = initialSelectedGroupIds.filter(
      (id) => !selected.includes(id),
    );

    try {
      await Promise.all([
        newlyShared.length > 0
          ? shareToGroups({ groupIds: newlyShared })
          : Promise.resolve(),
        ...newlyUnshared.map((groupId) => unshareFromGroup({ groupId })),
      ]);
      invalidateAfterChange();
      onOpenChange(false);
      if (newlyShared.length > 0 || newlyUnshared.length > 0) {
        toast.success('공유 설정이 변경되었어요.');
      }
    } catch {
      toast.error('공유 설정 변경에 실패했습니다.');
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
    >
      <DrawerContent className="w-full px-6 sm:px-8 pt-4 pb-8 sm:pb-10">
        <DrawerHeader className="px-0">
          <div className="pt-4 flex justify-between items-center mb-2">
            <DrawerTitle className="flex flex-col justify-center items-start">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                SHARE TO GROUPS
              </span>
              <span className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                어느 그룹에 공유할까요?
              </span>
            </DrawerTitle>
            <DrawerClose className="p-2 text-gray-400 cursor-pointer">
              <X className="w-6 h-6" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-2 mt-2 overflow-y-auto scrollbar-hide max-h-[50vh]">
          {groups.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
              <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
                <Users className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold dark:text-gray-200 text-gray-700">
                  공유할 그룹이 없어요
                </h3>
                <p className="text-xs text-gray-400">
                  먼저 그룹을 만들거나 가입해보세요!
                </p>
              </div>
            </div>
          ) : (
            groups.map((group) => {
              const isViewer = group.permission === 'VIEWER';
              const isSelected = selected.includes(group.groupId);
              const wasAlreadyShared = initialSelectedGroupIds.includes(
                group.groupId,
              );
              const canToggle = !isViewer || wasAlreadyShared;
              return (
                <button
                  key={group.groupId}
                  onClick={() => canToggle && toggleGroup(group.groupId)}
                  disabled={!canToggle}
                  className={`flex items-center gap-4 py-3 px-2 rounded-xl sm:rounded-2xl transition-all ${
                    !canToggle
                      ? 'opacity-50 cursor-not-allowed dark:bg-white/5 bg-gray-50'
                      : 'active:scale-[0.98] dark:bg-white/5 dark:hover:bg-white/10 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden border-2 shadow-sm dark:border-[#121212] border-white">
                    {group.cover?.assetId ? (
                      <AssetImage
                        assetId={group.cover.assetId}
                        alt={group.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <AssetImage
                        alt={group.name}
                        width={48}
                        height={48}
                        assetId={randomBaseImage(group.groupId)}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left overflow-hidden">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                      <p className="text-sm sm:text-base font-semibold dark:text-white text-itta-black truncate">
                        {group.name}
                      </p>
                      {wasAlreadyShared && (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shrink-0">
                          <Share2 className="w-2.5 h-2.5" />
                          <span>공유됨</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {group.memberCount}명의 멤버
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isSelected
                        ? 'bg-[#10B981] border-[#10B981] text-white'
                        : 'border-gray-300 dark:border-white/20 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="mt-4 w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-itta-black text-white active:scale-95 transition-all shadow-lg shadow-black/10 dark:bg-white dark:text-black disabled:opacity-50"
        >
          확인
        </button>
      </DrawerContent>
    </Drawer>
  );
}
