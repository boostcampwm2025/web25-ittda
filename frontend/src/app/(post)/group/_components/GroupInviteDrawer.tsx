'use client';

import { useState } from 'react';
import {
  UserPlus,
  X,
  ShieldCheck,
  Edit3,
  Eye,
  Check,
  Copy,
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
import { GroupInfo, GroupRoleType } from '@/lib/types/group';
import { cn } from '@/lib/utils';

interface GroupInviteDrawerProps {
  groupId: string;
  groupInfo: GroupInfo;
}

export default function GroupInviteDrawer({
  groupId,
  groupInfo,
}: GroupInviteDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedInviteRole, setSelectedInviteRole] =
    useState<GroupRoleType>('EDITOR');

  const { data: inviteResult } = useCreateInviteCode(
    groupId,
    selectedInviteRole,
    isOpen,
  );

  const getFullInviteUrl = (code: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/invite?inviteCode=${code}`;
    }
    return '';
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
  ];

  const handleRoleChange = (roleId: GroupRoleType) => {
    setSelectedInviteRole(roleId);
  };

  const handleCopyCode = () => {
    const code = inviteResult?.code || groupInfo.inviteCode;
    navigator.clipboard.writeText(getFullInviteUrl(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKakaoShare = () => {
    if (!window.Kakao?.Share) return;

    const code = inviteResult?.code || groupInfo.inviteCode;

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
                      'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95',
                      isSelected
                        ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                        : 'dark:bg-white/5 dark:border-white/5 dark:text-gray-500 bg-gray-50 border-gray-100 text-gray-400',
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        isSelected
                          ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20'
                          : 'dark:bg-black/20 dark:text-gray-600 bg-white text-gray-300 shadow-sm',
                      )}
                    >
                      {role.icon}
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-bold mb-0.5">
                        {role.label}
                      </p>
                      <p className="text-[9px] font-medium opacity-60 leading-tight">
                        {role.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[13px] font-medium text-gray-400">
              초대 코드를 공유하여 가족이나 친구와 함께 추억을 쌓아보세요.
            </p>
            <div className="p-6 rounded-3xl border-2 border-dashed flex flex-col items-center gap-4 dark:bg-black/20 dark:border-white/10 bg-gray-50 border-gray-100">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold tracking-widest text-[#10B981] break-all text-center">
                  {getFullInviteUrl(inviteResult?.code || groupInfo.inviteCode)}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  {selectedInviteRole} LEVEL
                </span>
              </div>
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
                {copied ? '복사 완료' : '복사하기'}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <DrawerClose className="cursor-pointer flex-1 py-4 rounded-2xl font-bold text-sm dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-400">
              닫기
            </DrawerClose>
            <button
              onClick={handleKakaoShare}
              className="cursor-pointer flex-2 py-4 rounded-2xl bg-itta-black dark:bg-white text-white dark:text-itta-black text-sm font-bold shadow-xl active:scale-95 transition-all"
            >
              카카오톡으로 공유
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
