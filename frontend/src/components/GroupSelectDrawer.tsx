'use client';

import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { X, Users, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface Group {
  id: string;
  name: string;
  members: number;
  coverUrl?: string;
}

interface GroupSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
}

export default function GroupSelectDrawer({
  open,
  onOpenChange,
  groups,
}: GroupSelectDrawerProps) {
  const router = useRouter();

  const handleSelectGroup = (groupId: string) => {
    onOpenChange(false);
    router.push(`/add?groupId=${groupId}`);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
    >
      <DrawerContent className="w-full px-6 py-4 pb-10">
        <DrawerHeader className="px-0">
          <div className="pt-4 flex justify-between items-center mb-2">
            <DrawerTitle className="flex flex-col justify-center items-start">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                SELECT GROUP
              </span>
              <span className="text-xl font-bold dark:text-white text-itta-black">
                어느 그룹에 기록할까요?
              </span>
            </DrawerTitle>
            <DrawerClose className="p-2 text-gray-400 cursor-pointer">
              <X className="w-6 h-6" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-2 mt-2 overflow-y-auto">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group.id)}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] dark:bg-white/5 dark:hover:bg-white/10 bg-gray-50 hover:bg-gray-100"
            >
              {group.coverUrl ? (
                <Image
                  src={group.coverUrl}
                  alt={group.name}
                  width={50}
                  height={50}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold dark:text-white text-itta-black truncate">
                  {group.name}
                </p>
                <p className="text-sm text-gray-500">
                  {group.members}명의 멤버
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}

          {groups.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <p>참여 중인 그룹이 없습니다.</p>
              <p className="text-sm mt-1">그룹을 만들거나 초대를 받아보세요.</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
