import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MonthRecords from '../MonthRecords';
import { MonthRecord } from '@/lib/types/record';

const mockMonthRecords: MonthRecord[] = [
  {
    id: '2025-01',
    name: '2025년 1월',
    count: 12,
    latestTitle: '새해 첫 일출 보기',
    latestLocation: '정동진 해변',
    coverUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2024-12',
    name: '2024년 12월',
    count: 8,
    latestTitle: '크리스마스 마켓',
    latestLocation: '명동 거리',
    coverUrl:
      'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2024-11',
    name: '2024년 11월',
    count: 5,
    latestTitle: '단풍 구경',
    latestLocation: '설악산',
    coverUrl:
      'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2024-10',
    name: '2024년 10월',
    count: 3,
    latestTitle: '할로윈 파티',
    latestLocation: '이태원',
    coverUrl: null,
  },
];

const meta = {
  title: 'Record/MonthRecords',
  component: MonthRecords,
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
    monthRecords: {
      description: '월별 기록 데이터 배열',
    },
    cardRoute: {
      description: '카드 클릭 시 이동할 라우트 경로',
    },
  },
} satisfies Meta<typeof MonthRecords>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 내 기록함
export const Default: Story = {
  args: {
    monthRecords: mockMonthRecords,
    cardRoute: '/my/month',
  },
  parameters: {
    docs: {
      description: {
        story: '내 기록함 - 월별 기록 카드 그리드',
      },
    },
  },
};

// 그룹 기록함
export const GroupRecords: Story = {
  args: {
    monthRecords: mockMonthRecords,
    cardRoute: '/group/group-123/month',
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 기록함 - 월별 기록 카드 그리드',
      },
    },
  },
};

// 기록이 없는 경우
export const EmptyRecords: Story = {
  args: {
    monthRecords: [],
    cardRoute: '/my/month',
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 없는 경우 - 아이콘과 버튼이 포함된 빈 상태 UI 표시',
      },
    },
  },
};

// 커버 이미지가 없는 기록들
export const NoCoverImages: Story = {
  args: {
    monthRecords: mockMonthRecords.map((r) => ({ ...r, coverUrl: null })),
    cardRoute: '/my/month',
  },
  parameters: {
    docs: {
      description: {
        story: '커버 이미지가 없는 기록들 - 기본 배경 표시',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    monthRecords: mockMonthRecords,
    cardRoute: '/my/month',
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
