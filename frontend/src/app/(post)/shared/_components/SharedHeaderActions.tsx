'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useApiPost } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ListFilter,
  Plus,
  SortAsc,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type GroupSortOption = 'latest' | 'count' | 'members' | 'name';

export default function SharedHeaderActions() {
  const [sortBy, setSortBy] = useState<GroupSortOption>('latest');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const queryClient = useQueryClient();

  const { mutate } = useApiPost('/api/groups', {
    onSuccess: () => {
      // 공유 기록함 리스트 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['share'] });
    },
    onSettled: () => {
      setNewGroupName('');
      setShowCreateModal(false);
      setIsCreating(false);
    },
  });

  const handleCreateGroup = () => {
    const groupNameRegex = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]{2,10}$/;

    if (!newGroupName.trim()) {
      toast.error('그룹 이름을 입력해주세요.');
      return;
    }

    if (!groupNameRegex.test(newGroupName)) {
      toast.error('이름은 2~10자의 한글, 영문, 숫자, 공백만 가능합니다.');
      return;
    }

    setIsCreating(true);
    mutate({ name: newGroupName });
  };

  return (
    <>
      <Drawer>
        <DrawerTrigger className="cursor-pointer p-2.5 rounded-2xl transition-all dark:bg-white/5 dark:text-gray-400 bg-gray-50 text-gray-500">
          <ListFilter className="w-5 h-5" />
        </DrawerTrigger>
        <DrawerContent className="w-full px-8 pt-4 pb-10">
          <DrawerHeader className="flex justify-center items-start pl-2">
            <DrawerTitle className="text-lg font-bold mb-3 dark:text-white text-itta-black">
              그룹 정렬
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2">
            {[
              {
                id: 'latest',
                label: '최신 활동순',
                icon: <CalendarDays className="w-4 h-4" />,
              },
              {
                id: 'count',
                label: '기록 많은순',
                icon: <BarChart3 className="w-4 h-4" />,
              },
              {
                id: 'members',
                label: '멤버 많은순',
                icon: <Users className="w-4 h-4" />,
              },
              {
                id: 'name',
                label: '그룹 이름순',
                icon: <SortAsc className="w-4 h-4" />,
              },
            ].map((option) => (
              <DrawerClose key={option.id} asChild>
                <button
                  onClick={() => {
                    setSortBy(option.id as GroupSortOption);
                  }}
                  className={cn(
                    'cursor-pointer w-full flex items-center justify-between p-4 rounded-2xl transition-all',
                    sortBy === option.id
                      ? 'bg-[#10B981]/10 text-[#10B981]'
                      : 'dark:hover:bg-white/5 dark:text-gray-500 hover:bg-gray-50 text-gray-500',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <span className="text-sm font-bold">{option.label}</span>
                  </div>
                  {sortBy === option.id && (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  )}
                </button>
              </DrawerClose>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DrawerTrigger
          onClick={() => setShowCreateModal(true)}
          className="cursor-pointer p-2.5 rounded-2xl transition-all shadow-md dark:bg-[#10B981] dark:text-white bg-[#222222] text-white"
        >
          <Plus className="w-5 h-5" />
        </DrawerTrigger>
        <DrawerContent className="w-full p-8 pb-12">
          <div className="flex justify-between items-center mb-8 w-full">
            <DrawerHeader className="pl-0">
              <DrawerTitle className="flex flex-col justify-center items-start pl-0">
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                  CREATE GROUP
                </span>
                <span className="text-xl font-bold dark:text-white text-itta-black">
                  새 공유 기록함 만들기
                </span>
              </DrawerTitle>
            </DrawerHeader>
            <DrawerClose
              onClick={() => setShowCreateModal(false)}
              className="cursor-pointer p-2 text-gray-400"
            >
              <X className="w-6 h-6" />
            </DrawerClose>
          </div>

          <div className="space-y-6 mb-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                기록함 이름
              </label>
              <input
                autoFocus
                type="text"
                placeholder="예: 제주도 여행기"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border-b-2 bg-transparent py-3 text-lg font-bold transition-all outline-none dark:border-white/5 dark:focus:border-[#10B981] dark:text-white border-gray-100 focus:border-[#10B981] text-itta-black"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <DrawerClose
              onClick={() => setShowCreateModal(false)}
              className="cursor-pointer flex-1 py-4 rounded-2xl font-bold text-sm dark:bg-white/5 dark:text-gray-500 bg-gray-50 text-gray-400"
            >
              취소
            </DrawerClose>
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isCreating}
              className={cn(
                'flex-2 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                newGroupName.trim() && !isCreating
                  ? 'bg-[#10B981] text-white active:scale-95 cursor-pointer'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed',
              )}
            >
              {isCreating ? (
                '생성 중...'
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  기록함 만들기
                </>
              )}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
