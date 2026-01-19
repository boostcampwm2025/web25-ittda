import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MonthlyDetailHeaderActions from '../MonthlyDetailHeaderActions';

const meta = {
  title: 'Record/MonthlyDetailHeaderActions',
  component: MonthlyDetailHeaderActions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '월별 상세 페이지 헤더 액션 - 뒤로가기, 월 표시, 정렬 버튼을 포함합니다. 정렬 버튼을 클릭하여 Drawer를 열어보세요.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between py-4 px-4 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </header>
      </div>
    ),
  ],
  argTypes: {
    month: {
      description: '표시할 월 (YYYY-MM 형식)',
      control: 'text',
    },
    title: {
      description: '상단 라벨 텍스트',
      control: 'text',
    },
    onClick: {
      description: '클릭 핸들러 (선택)',
    },
  },
} satisfies Meta<typeof MonthlyDetailHeaderActions>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 내 기록함
export const Default: Story = {
  args: {
    month: '2025-01',
    title: 'MY RECORDS',
  },
  parameters: {
    docs: {
      description: {
        story:
          '내 기록함 월별 상세 헤더 - 정렬 버튼을 클릭하면 정렬 옵션 Drawer가 열립니다.',
      },
    },
  },
};

// 그룹 기록함
export const GroupRecords: Story = {
  args: {
    month: '2024-12',
    title: 'GROUP RECORDS',
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 기록함 월별 상세 헤더',
      },
    },
  },
};

// 다른 월
export const DifferentMonth: Story = {
  args: {
    month: '2024-06',
    title: 'MY RECORDS',
  },
  parameters: {
    docs: {
      description: {
        story: '다른 월 표시 예시',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    month: '2025-01',
    title: 'MY RECORDS',
    className: 'dark',
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
      <div className="max-w-md mx-auto w-full dark">
        <header className="sticky top-0 z-20 flex items-center justify-between py-4 px-4 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </header>
      </div>
    ),
  ],
};
