'use client';

import { ReactNode, useState } from 'react';
import {
  UserPlus,
  X,
  ShieldCheck,
  Edit3,
  Eye,
  Check,
  Copy,
  TriangleAlert,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useCreateInviteCode } from '@/hooks/useGroupInvite';
import { GroupRoleType } from '@/lib/types/group';
import { cn } from '@/lib/utils';

interface GroupInviteDrawerProps {
  groupId: string;
}

type CopyStatus = 'idle' | 'success' | 'error';

const copyStatusMap: Record<
  CopyStatus,
  { icon: ReactNode; text: string; style: string }
> = {
  idle: {
    icon: <Copy className="w-3.5 h-3.5" />,
    text: '복사하기',
    style: 'dark:bg-white/5 dark:text-gray-300 bg-white text-gray-600',
  },
  success: {
    icon: <Check className="w-3.5 h-3.5" />,
    text: '복사 완료',
    style: 'bg-[#10B981] text-white',
  },
  error: {
    icon: <TriangleAlert className="w-3.5 h-3.5" />,
    text: '복사 실패',
    style: 'bg-red-500 text-white',
  },
};

const roles = [
  {
    id: 'ADMIN',
    label: '관리자',
    desc: '모든 관리 및 기록 권한',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: 'EDITOR',
    label: '에디터',
    desc: '기록 생성 및 수정 권한',
    icon: <Edit3 className="w-4 h-4" />,
  },
  {
    id: 'VIEWER',
    label: '뷰어',
    desc: '기록 열람만 가능한 권한',
    icon: <Eye className="w-4 h-4" />,
  },
] as const;

export default function GroupInviteDrawer({ groupId }: GroupInviteDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [selectedInviteRole, setSelectedInviteRole] =
    useState<GroupRoleType>('EDITOR');

  const {
    data: inviteResult,
    error,
    isLoading,
  } = useCreateInviteCode(groupId, selectedInviteRole, isOpen);

  const getFullInviteUrl = (code: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/invite?inviteCode=${code}`;
    }
    return '';
  };

  const handleRoleChange = (roleId: GroupRoleType) => {
    setSelectedInviteRole(roleId);
  };

  const handleCopyCode = async () => {
    const code = inviteResult?.code || '잇다-';
    try {
      await navigator.clipboard.writeText(getFullInviteUrl(code));
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleKakaoShare = () => {
    if (!window.Kakao || !window.Kakao?.Share) return;

    const code = inviteResult?.code || '잇다-';

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '기억과 맥락을, 잇다-',
        description: '당신을 그룹에 초대합니다!',
        imageUrl:
          'https://substantial-jade-zgft0gga6m.edgeone.app/%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202026-01-16%20003841.png',
        link: {
          mobileWebUrl: getFullInviteUrl(code),
          webUrl: getFullInviteUrl(code),
        },
      },
    });
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setIsOpen}
      shouldScaleBackground={false}
    >
      <DrawerTrigger className="cursor-pointer p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 dark:bg-white/5 dark:text-[#10B981] bg-gray-50 text-[#10B981]">
        <UserPlus className="w-5 h-5" />
      </DrawerTrigger>

      <DrawerContent className="w-full px-6 sm:px-8 pt-4 pb-8 sm:pb-10">
        <DrawerHeader className="px-0">
          <div className="flex justify-between items-center mb-2">
            <DrawerTitle className="flex flex-col justify-center items-start pl-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                Invite Members
              </span>
              <span className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                멤버 초대하기
              </span>
            </DrawerTitle>
            <DrawerClose className="p-2 text-gray-400 cursor-pointer">
              <X className="w-6 h-6" />
            </DrawerClose>
          </div>
        </DrawerHeader>
        {isLoading ? (
          <div className="py-14 sm:py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#10B981] animate-spin" />
            <p className="text-xs sm:text-sm font-medium text-gray-400">
              초대 코드를 생성 중입니다...
            </p>
          </div>
        ) : error ? (
          /* 권한이 없거나 에러가 발생한 경우의 UI */
          <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-itta-black dark:text-white mb-2">
                초대 권한이 없습니다
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                해당 그룹의 멤버를 초대할 수 있는 권한이 없습니다.
                <br />
                그룹 관리자에게 문의하여 권한을 확인해 주세요.
              </p>
            </div>

            <DrawerClose className="cursor-pointer w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-itta-black text-white dark:bg-white dark:text-itta-black shadow-xl active:scale-95 transition-all">
              확인 후 닫기
            </DrawerClose>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                초대 권한 설정
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((role) => {
                  const isSelected = selectedInviteRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleChange(role.id as GroupRoleType)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all active:scale-95',
                        isSelected
                          ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                          : 'dark:bg-white/5 dark:border-white/5 dark:text-gray-500 bg-gray-50 border-gray-100 text-gray-400',
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0',
                          isSelected
                            ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20'
                            : 'dark:bg-black/20 dark:text-gray-600 bg-white text-gray-300 shadow-sm',
                        )}
                      >
                        {role.icon}
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] sm:text-[13px] font-bold mb-0.5">
                          {role.label}
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-medium opacity-60 leading-tight">
                          {role.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-[13px] font-medium text-gray-400">
                초대 코드를 공유하여 가족이나 친구와 함께 추억을 쌓아보세요.
              </p>
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-dashed flex flex-col items-center gap-3 sm:gap-4 dark:bg-black/20 dark:border-white/10 bg-gray-50 border-gray-100">
                <div className="flex flex-col items-center">
                  <span className="text-sm sm:text-lg font-bold tracking-widest text-[#10B981] break-all text-center">
                    {getFullInviteUrl(inviteResult?.code || '잇다-')}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                    {selectedInviteRole} LEVEL
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs transition-all shadow-sm ${copyStatusMap[copyStatus].style}`}
                >
                  {copyStatusMap[copyStatus].icon}
                  {copyStatusMap[copyStatus].text}
                </button>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <DrawerClose className="cursor-pointer flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-400">
                닫기
              </DrawerClose>
              <button
                onClick={handleKakaoShare}
                className="cursor-pointer flex-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-itta-black dark:bg-white text-white dark:text-itta-black text-xs sm:text-sm font-bold shadow-xl active:scale-95 transition-all"
              >
                카카오톡으로 공유
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
