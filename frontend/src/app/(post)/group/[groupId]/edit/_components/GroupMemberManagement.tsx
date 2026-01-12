'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Member } from '@/lib/types/group';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Shield,
  ShieldCheck,
  UserMinus,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { useGroupEdit } from './GroupEditContext';
import { cn } from '@/lib/utils';

interface GroupMemberManagementProps {
  members: Member[];
}

interface Role {
  id: 'admin' | 'member';
  label: string;
  desc: string;
  icon: ReactNode;
}

// TODO: 유저 정보는 로그인 후 서버로부터 받아옴 (전역 상태로 관리 필요)
const user = {
  id: 1,
  nickname: '도비',
  profileImageUrl: '/profile-ex.jpeg',
  email: 'test@naver.com',
};

const ROLE: Role[] = [
  {
    id: 'admin',
    label: '관리자',
    desc: '그룹 정보를 수정하고 멤버를 관리(초대/삭제)할 수 있습니다.',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: 'member',
    label: '멤버',
    desc: '그룹의 기록을 열람하고 새로운 기록을 자유롭게 남길 수 있습니다.',
    icon: <Shield className="w-4 h-4" />,
  },
];

export default function GroupMemberManagement({}: GroupMemberManagementProps) {
  const { members, setMembers } = useGroupEdit();
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);
  const [showRoleDrawer, setShowRoleDrawer] = useState(false);
  const [deleteMember, setDeleteMember] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const confirmRemoveMember = (id: number, name: string) => {
    setShowDeleteDrawer(true);
    setDeleteMember({ id, name });
  };

  const handleRemoveMember = () => {
    if (deleteMember) {
      setMembers(members.filter((m) => m.id !== deleteMember.id));
    }
  };

  const resetDeleteMember = () => {
    setDeleteMember(null);
  };

  const openRoleDrawer = (member: Member) => {
    setEditingMember(member);
    setShowRoleDrawer(true);
  };

  const handleRoleChange = (newRole: Role['id']) => {
    if (!editingMember) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === editingMember.id ? { ...m, role: newRole } : m,
      ),
    );
    setShowRoleDrawer(false);
    setEditingMember(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          멤버 관리 ({members.length})
        </label>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-2xl border transition-colors dark:bg-white/5 dark:border-white/5 bg-gray-50 border-black/2"
          >
            <div className="flex items-center gap-3">
              <Image
                width={50}
                height={50}
                src={member.avatar}
                className="w-10 h-10 rounded-full border bg-white"
                alt=""
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold dark:text-gray-200 text-itta-black">
                    {member.name}
                  </span>
                  {member.role === 'admin' && (
                    <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                  )}
                </div>
                <button
                  onClick={() =>
                    user.id !== member.id && openRoleDrawer(member)
                  }
                  className="cursor-pointer flex items-center gap-1 group transition-all dark:text-gray-500 dark:hover:text-gray-300 text-gray-400 hover:text-gray-600"
                >
                  <span className="text-[10px] text-gray-400">
                    {member.role === 'admin' ? '관리자' : '멤버'}
                  </span>
                  {/* TODO: 내가 관리자가 아닐 경우의 조건 추가 */}
                  {user.id !== member.id && (
                    <ChevronRight className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>
              </div>
            </div>
            {/* TODO: 내가 아닐 경우, 내가 관리자 권한이 아닐 경우의 조건 추가 */}
            {member.role !== 'admin' && (
              <button
                onClick={() => confirmRemoveMember(member.id, member.name)}
                className="cursor-pointer p-2 rounded-xl transition-colors dark:hover:bg-red-500/10 dark:text-gray-500 hover:bg-red-50 text-gray-400"
              >
                <UserMinus className="w-4 h-4 hover:text-red-500" />
              </button>
            )}
          </div>
        ))}

        <Drawer
          onClose={resetDeleteMember}
          open={showDeleteDrawer}
          onOpenChange={setShowDeleteDrawer}
        >
          <DrawerContent className="px-8 pt-4 pb-12">
            <DrawerHeader>
              <div className="flex flex-col items-center text-center space-y-4 mb-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                    {`정말 '${deleteMember?.name}'님을 그룹에서 내보내시겠습니까?`}
                  </DrawerTitle>
                </div>
              </div>
            </DrawerHeader>

            <div className="flex gap-4">
              <DrawerClose className="cursor-pointer flex-1 py-4 rounded-2xl text-sm font-bold transition-all dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-500 active:bg-gray-200">
                취소
              </DrawerClose>
              <DrawerClose
                onClick={handleRemoveMember}
                className="cursor-pointer flex-2 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
              >
                내보내기
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer
          open={showRoleDrawer && editingMember !== null}
          onOpenChange={setShowRoleDrawer}
        >
          <DrawerContent className="w-full px-8 pt-4 pb-10">
            <DrawerHeader>
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col justify-center items-start">
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                    Set Permissions
                  </span>
                  <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                    {editingMember?.name}님의 권한 변경
                  </DrawerTitle>
                </div>
                <DrawerClose className="p-2 text-gray-400">
                  <X className="w-6 h-6" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="space-y-3">
              {ROLE.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={cn(
                    'cursor-pointer w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.98]',
                    editingMember?.role === role.id
                      ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                      : 'dark:bg-white/5 dark:border-white/5 dark:text-gray-400 bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100',
                  )}
                >
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        editingMember?.role === role.id
                          ? 'bg-[#10B981] text-white'
                          : 'dark:bg-black/20 dark:text-gray-600 bg-white text-gray-300 shadow-sm',
                      )}
                    >
                      {role.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1">{role.label}</p>
                      <p className="text-[11px] font-medium opacity-60 leading-relaxed">
                        {role.desc}
                      </p>
                    </div>
                  </div>
                  {editingMember?.role === role.id && (
                    <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <DrawerClose className="cursor-pointer w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 dark:bg-white/5 dark:text-gray-500 bg-itta-black text-white">
                닫기
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </section>
  );
}
