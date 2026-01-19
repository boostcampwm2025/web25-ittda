import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import GalleryDrawer from '../GalleryDrawer';
import { MonthRecord } from '@/lib/types/record';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // cn 유틸리티 함수가 있다고 가정합니다.

const mockPhotos = [
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
];

const mockMonthRecords: MonthRecord[] = [
  {
    id: '2025-01',
    name: '2025년 1월',
    count: 12,
    latestTitle: '새해 첫 일출',
    latestLocation: '정동진',
    coverUrl: mockPhotos[0],
  },
];

// GalleryDrawer를 Drawer로 감싸는 래퍼 컴포넌트
function GalleryDrawerWrapper({
  recordPhotos,
  initialRecords,
  className, // DrawerContent에 전달할 다크모드용 클래스
}: {
  recordPhotos: string[];
  initialRecords: MonthRecord[];
  className?: string;
}) {
  const [months, setMonths] = useState(initialRecords);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="cursor-pointer flex items-center gap-2 px-4 py-3 rounded-xl bg-[#10B981] text-white font-bold text-sm transition-all active:scale-95">
          <ImageIcon className="w-4 h-4" />
          커버 사진 선택 열기
        </button>
      </DrawerTrigger>

      {/* 💡 Portal 위치는 유지하되, className에 'dark'를 직접 넣어 다크모드 적용 */}
      <DrawerContent className={cn('w-full px-8 py-4 pb-10', className)}>
        <DrawerHeader>
          <div className="pt-4 flex justify-between items-center mb-6">
            <DrawerTitle className="flex flex-col">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                CHOOSE COVER
              </span>
              <span className="text-lg font-bold dark:text-white text-itta-black">
                커버 사진 선택
              </span>
            </DrawerTitle>
            <DrawerClose className="p-2 text-gray-400 cursor-pointer">
              <X className="w-6 h-6" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <GalleryDrawer
          recordPhotos={recordPhotos}
          value={months}
          setValue={setMonths}
          activeId={months[0]?.id || null}
        />
      </DrawerContent>
    </Drawer>
  );
}

const meta = {
  title: 'Record/GalleryDrawer',
  component: GalleryDrawerWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-10 bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GalleryDrawerWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    recordPhotos: mockPhotos,
    initialRecords: mockMonthRecords,
  },
};

export const FewPhotos: Story = {
  args: {
    recordPhotos: mockPhotos.slice(0, 3),
    initialRecords: mockMonthRecords,
  },
};

export const NoPhotos: Story = {
  args: {
    recordPhotos: [],
    initialRecords: [
      {
        ...mockMonthRecords[0],
        coverUrl: null,
      },
    ],
  },
};

// 💡 다크 모드 스토리
export const DarkMode: Story = {
  args: {
    recordPhotos: mockPhotos,
    initialRecords: mockMonthRecords,
    className: 'dark', // DrawerContent 내부의 다크모드 활성화
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark bg-[#121212] p-10">
        <Story />
      </div>
    ),
  ],
};
