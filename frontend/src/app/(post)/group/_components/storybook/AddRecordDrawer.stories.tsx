import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddRecordDrawer } from '../AddRecordDrawer';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function AddRecordTrigger({ groupId }: { groupId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-itta-black text-white text-sm font-bold"
      >
        기록 추가
      </button>
      <AddRecordDrawer isOpen={isOpen} onOpenChange={setIsOpen} groupId={groupId} />
    </>
  );
}

const meta = {
  title: 'Group/AddRecordDrawer',
  component: AddRecordDrawer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '그룹 홈에서 기록 방식을 선택하는 드로어 컴포넌트입니다. 혼자 기록(개인 기록 페이지 이동)과 공동 기록(새 그룹 드래프트 생성 후 편집 페이지 이동)을 선택할 수 있습니다. groupId가 없으면 공동 기록 버튼이 비활성화됩니다.',
      },
    },
    nextjs: {
      navigation: { pathname: '/group/group-1' },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof AddRecordDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <AddRecordTrigger groupId="group-1" />,
  parameters: {
    docs: {
      description: {
        story: `
기록 방식 선택 드로어 기본 상태 — 그룹 ID가 있어 공동 기록 버튼이 활성화된 상태.

- **혼자 기록 클릭**: \`/add?groupId={groupId}\`로 이동
- **공동 기록 클릭**: 새 공동 작성 드래프트를 생성 후 편집 페이지로 이동
        `,
      },
    },
  },
};

export const WithoutGroup: Story = {
  render: () => <AddRecordTrigger />,
  parameters: {
    docs: {
      description: {
        story: 'groupId가 없는 경우 — 공동 기록 버튼이 비활성화(흐림 처리)되어 클릭 불가',
      },
    },
  },
};
