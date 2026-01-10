'use client';

import Back from '@/components/Back';
import DateSelectorDrawer from '@/components/DateSelectorDrawer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Popover } from '@/components/ui/popover';
import { GroupInfo } from '@/lib/types/group';
import { cn } from '@/lib/utils';
import { useGroupVoice } from '@/store/useGroupVoice';
import {
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import {
  LogOut,
  Mic,
  MoreVertical,
  Settings,
  UserPlus,
  X,
  Check,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface GroupHeaderActionsProps {
  groupInfo: GroupInfo;
}

export default function GroupHeaderActions({
  groupInfo,
}: GroupHeaderActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const groupId = pathname.split('/').at(-1);
  const { isVoiceActive, setIsVoiceActive } = useGroupVoice();
  const [copied, setCopied] = useState(false);
  const [showLeaveGroup, setShowLeaveGroup] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(groupInfo.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveGroup = () => {
    // TODO: 서버에게 그룹 나가기 요청
    router.push('/shared');
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <Back />
      <div className="flex items-center gap-2">
        {/* 보이스 컨트롤은 이제 App.tsx에서 전역으로 관리되므로, 여기서는 개별적으로 대화를 시작하는 버튼만 남겨둠 */}
        {/* TODO: 보이스 연결에 필요한 데이터 전역 상태에 추가 */}
        {!isVoiceActive && (
          <button
            onClick={() => setIsVoiceActive(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all active:scale-95 shadow-sm dark:bg-[#10B981]/15 dark:text-[#10B981] bg-[#10B981]/10 text-[#10B981]"
          >
            <Mic className="w-3.5 h-3.5" />
            보이스 연결
          </button>
        )}

        <Drawer shouldScaleBackground={false}>
          <DrawerTrigger className="cursor-pointer p-2.5 rounded-xl transition-all active:scale-95 dark:bg-white/5 dark:text-[#10B981] bg-gray-50 text-[#10B981]">
            <UserPlus className="w-5 h-5" />
          </DrawerTrigger>
          <DrawerContent className="w-full px-8 pt-4 pb-12">
            <DrawerHeader className="px-0">
              <div className="flex justify-between items-center mb-8">
                <DrawerTitle className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                    Invite Members
                  </span>
                  <span className="text-xl font-bold dark:text-white text-itta-black">
                    멤버 초대하기
                  </span>
                </DrawerTitle>
                <DrawerClose className="p-2 text-gray-400 cursor-pointer">
                  <X className="w-6 h-6" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[13px] font-medium text-gray-400">
                  초대 코드를 공유하여 가족이나 친구와 함께 추억을 쌓아보세요.
                </p>
                <div className="p-6 rounded-3xl border-2 border-dashed flex flex-col items-center gap-4 dark:bg-black/20 dark:border-white/10 bg-gray-50 border-gray-100">
                  <span className="text-lg font-bold tracking-widest text-[#10B981]">
                    {groupInfo.inviteCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className={cn(
                      'flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm',
                      copied
                        ? 'bg-[#10B981] text-white'
                        : 'cursor-pointer dark:bg-white/5 dark:text-gray-300 bg-white text-gray-600',
                    )}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? '복사 완료' : '코드 복사하기'}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <DrawerClose className="cursor-pointer flex-1 py-4 rounded-2xl font-bold text-sm dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-400">
                  닫기
                </DrawerClose>
                {/* TODO: 카톡 공유 기능 추가 */}
                <button className="cursor-pointer flex-2 py-4 rounded-2xl bg-itta-black dark:bg-white text-white dark:text-itta-black text-sm font-bold shadow-xl active:scale-95 transition-all">
                  카카오톡으로 공유
                </button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        <DateSelectorDrawer
          dayRoute={`/group/${groupId}/detail`}
          monthRoute={`/group/${groupId}/month`}
          yearRoute={`/group/${groupId}/year`}
        />

        <Popover>
          <PopoverTrigger className="cursor-pointer p-2.5 rounded-xl transition-colors active:scale-95 dark:bg-white/5 dark:text-gray-500 bg-gray-50 text-gray-400">
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
          <DrawerContent className="px-8 pt-4 pb-12">
            <DrawerHeader>
              <div className="flex flex-col items-center text-center space-y-4 mb-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                    {`정말 '${groupInfo.name}' 그룹에서 나가시겠습니까?`}
                  </DrawerTitle>
                  <p className="text-sm text-gray-400 font-medium">
                    그룹의 기록을 확인할 수 없게 됩니다.
                  </p>
                </div>
              </div>
            </DrawerHeader>

            <div className="flex gap-4">
              <DrawerClose className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-500 active:bg-gray-200">
                취소
              </DrawerClose>
              <DrawerClose
                onClick={handleLeaveGroup}
                className="cursor-pointer flex-2 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
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
