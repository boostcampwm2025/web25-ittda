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
          '월별 상세 페이지의 헤더 액션 영역 컴포넌트입니다. 뒤로가기 버튼, 라벨·월 표시 영역, 정렬 버튼을 포함합니다. 정렬 버튼 클릭 시 드로어가 열려 기록 정렬 옵션을 선택할 수 있으며, 개인/그룹 기록함 모두에서 공통으로 사용됩니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto">
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
          `
내 기록함 월별 상세 헤더 - 정렬 버튼을 클릭하면 정렬 옵션 Drawer가 열립니다.
- **뒤로가기 버튼**: 클릭 시 이전 페이지(아카이브)로 이동
- **정렬 버튼**: 클릭 시 정렬 옵션 드로어 표시 (최신순 / 오래된순 등)
- **연월 표시**: \`month\` prop(YYYY-MM)을 읽기 쉬운 형식으로 변환하여 표시
        `,
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

