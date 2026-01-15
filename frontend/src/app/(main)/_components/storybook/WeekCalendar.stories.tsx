import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import WeekCalendar from '../WeekCalendar';

const meta = {
  title: 'Calendar/WeekCalendar',
  component: WeekCalendar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto bg-white dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WeekCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '기본 주간 캘린더 - 현재 주를 표시하고 스와이프로 이전/다음 주 이동 가능',
      },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드 주간 캘린더',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="max-w-md mx-auto bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: `
주간 캘린더의 인터랙티브 기능:
- 날짜 클릭: 해당 날짜 선택 (미래 날짜는 비활성화)
- 스와이프: 좌우로 스와이프하여 이전/다음 주 이동
- 연월 클릭: 월별 뷰로 이동
- 오늘 날짜는 초록색 배경으로 표시
- 선택된 날짜는 검은색(라이트)/흰색(다크) 배경
- 일요일은 빨간색, 토요일은 파란색으로 표시
        `,
      },
    },
  },
};
