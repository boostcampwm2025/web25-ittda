import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import WeekCalendar from '../WeekCalendar';

const meta = {
  title: 'Calendar/WeekCalendar',
  component: WeekCalendar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '홈 화면 상단의 주간 캘린더 컴포넌트입니다. 현재 주의 날짜를 가로로 표시하며, 날짜 선택 시 RecordList가 해당 날짜의 기록을 표시합니다. 좌우 스와이프로 이전/다음 주를 탐색할 수 있으며, 연월 헤더를 탭하면 월별 뷰로 이동합니다.',
      },
    },
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
        story:`
기본 주간 캘린더 - 현재 주를 표시하고 스와이프로 이전/다음 주 이동 가능
- **날짜 클릭**: 해당 날짜 선택 후 RecordList가 해당 날짜 기록을 표시 (미래 날짜 비활성화)
- **좌우 스와이프**: 이전/다음 주로 이동
- **연월 헤더 클릭**: 월별 뷰 페이지로 이동
- **오늘 날짜**: 초록색 배경으로 강조 표시
- **선택된 날짜**: 라이트 모드 검은색 / 다크 모드 흰색 배경
- **요일 색상**: 일요일 빨간색, 토요일 파란색
        `,
      },
    },
  },
};

