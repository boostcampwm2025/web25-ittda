import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import DateSelectorDrawer from '../DateSelectorDrawer';

const meta = {
  title: 'Record/DateSelectorDrawer',
  component: DateSelectorDrawer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '날짜 선택 Drawer - 캘린더 뷰와 월 선택 뷰를 제공합니다. 버튼을 클릭하여 Drawer를 열어보세요.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-10 bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    dayRoute: { description: '일별 상세 페이지 라우트' },
    monthRoute: { description: '월별 상세 페이지 라우트' },
    yearRoute: { description: '연도별 페이지 라우트' },
  },
} satisfies Meta<typeof DateSelectorDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 내 기록함용
export const Default: Story = {
  args: {
    dayRoute: '/my/detail',
    monthRoute: '/my/month',
    yearRoute: '/my/year',
  },
};

// 그룹 기록함용
export const GroupRecords: Story = {
  args: {
    dayRoute: '/group/group-123/detail',
    monthRoute: '/group/group-123/month',
    yearRoute: '/group/group-123/year',
  },
};

// 💡 다크 모드 스토리 수정
export const DarkMode: Story = {
  args: {
    dayRoute: '/my/detail',
    monthRoute: '/my/month',
    yearRoute: '/my/year',
    className: 'dark',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '포털 오염 없이 구현된 다크 모드 스토리입니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="p-10 bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};
