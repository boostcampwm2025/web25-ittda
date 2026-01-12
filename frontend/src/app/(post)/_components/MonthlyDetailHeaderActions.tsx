'use client';

import Back from '@/components/Back';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { BarChart3, CalendarDays, Check, ListFilter, X } from 'lucide-react';
import { useState } from 'react';

type SortOption = 'date-desc' | 'date-asc' | 'count-desc';

interface MonthlyDetailHeaderActionsProps {
  month: string;
  title: string;
  onClick?: VoidFunction;
}

export default function MonthlyDetailHeaderActions({
  month,
  title,
  onClick,
}: MonthlyDetailHeaderActionsProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const sortOptions = [
    {
      id: 'date-desc',
      label: '최신순',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'date-asc',
      label: '오래된순',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'count-desc',
      label: '기록 많은순',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <Back />
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-[#10B981]">
          {title}
        </span>
        <span className="text-sm font-bold dark:text-white text-itta-black">
          {month?.replace('-', '년 ')}월
        </span>
      </div>
      <Drawer open={showSortMenu} onOpenChange={setShowSortMenu}>
        <DrawerTrigger asChild>
          <button
            onClick={() => setShowSortMenu(true)}
            className={cn(
              'cursor-pointer p-1.5 rounded-lg transition-colors',
              showSortMenu
                ? 'text-[#10B981] bg-[#10B981]/10'
                : 'text-gray-300 hover:bg-gray-100',
            )}
          >
            <ListFilter className="w-5 h-5" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="w-full px-8 pt-4 pb-10">
          <DrawerHeader>
            <div className="flex justify-between items-center mb-6">
              <DrawerTitle>
                <span className="text-lg font-bold dark:text-white text-itta-black">
                  기록 정렬
                </span>
              </DrawerTitle>
              <DrawerClose className="cursor-pointer p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="space-y-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSortBy(option.id as SortOption);
                  setShowSortMenu(false);
                }}
                className={cn(
                  'cursor-pointer w-full flex items-center justify-between p-4 rounded-2xl transition-all',
                  sortBy === option.id
                    ? 'dark:bg-[#10B981]/10 dark:text-[#10B981] bg-[#10B981]/5 text-[#10B981]'
                    : 'dark:hover:bg-white/5 dark:text-gray-400 hover:bg-gray-50 text-gray-500',
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
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
