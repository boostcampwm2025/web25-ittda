import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MonthlyDetailRecords from '../MonthlyDetailRecords';
import { DayRecord } from '@/lib/types/record';

const mockDayRecords: DayRecord[] = [
  {
    date: '2025-01-15',
    dayName: '수',
    title: '한강 산책',
    author: '나',
    count: 3,
    coverUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  },
  {
    date: '2025-01-12',
    dayName: '일',
    title: '북한산 등산',
    author: '나',
    count: 5,
    coverUrl:
      'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
  },
  {
    date: '2025-01-08',
    dayName: '수',
    title: '카페 투어',
    author: '나',
    count: 2,
    coverUrl:
      'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&q=80&w=400',
  },
  {
    date: '2025-01-03',
    dayName: '금',
    title: '연극 관람',
    author: '나',
    count: 1,
    coverUrl:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
  },
  {
    date: '2025-01-01',
    dayName: '수',
    title: '새해 일출',
    author: '나',
    count: 4,
    coverUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  },
];

const meta = {
  title: 'Record/MonthlyDetailRecords',
  component: MonthlyDetailRecords,
  parameters: {
    layout: 'padded',
    docs: {},
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    dayRecords: {
      description: '일별 기록 데이터 배열',
    },
    routePath: {
      description: '일별 상세 페이지 라우트 경로',
    },
    viewMapRoutePath: {
      description: '지도 보기 라우트 경로',
    },
  },
} satisfies Meta<typeof MonthlyDetailRecords>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 내 기록함 월별 상세
export const Default: Story = {
  args: {
    dayRecords: mockDayRecords,
    routePath: '/my/detail',
    viewMapRoutePath: '/my/map/month/2025-01',
  },
  parameters: {
    docs: {
      description: {
        story: '내 기록함 - 월별 상세 (일별 카드 그리드)',
      },
    },
  },
};

// 그룹 기록함 월별 상세
export const GroupRecords: Story = {
  args: {
    dayRecords: mockDayRecords,
    routePath: '/group/group-123/detail',
    viewMapRoutePath: '/group/group-123/map/month/2025-01',
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 기록함 - 월별 상세 (일별 카드 그리드)',
      },
    },
  },
};

// 기록이 적은 경우
export const FewRecords: Story = {
  args: {
    dayRecords: mockDayRecords.slice(0, 2),
    routePath: '/my/detail',
    viewMapRoutePath: '/my/map/month/2025-01',
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 적은 경우 (2개)',
      },
    },
  },
};

// 기록이 하나인 경우
export const SingleRecord: Story = {
  args: {
    dayRecords: [mockDayRecords[0]],
    routePath: '/my/detail',
    viewMapRoutePath: '/my/map/month/2025-01',
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 하나만 있는 경우',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    dayRecords: mockDayRecords,
    routePath: '/my/detail',
    viewMapRoutePath: '/my/map/month/2025-01',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="max-w-md mx-auto p-5 bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};
