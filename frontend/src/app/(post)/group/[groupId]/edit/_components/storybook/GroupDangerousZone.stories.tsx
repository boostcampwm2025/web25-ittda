import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GroupDangerousZone from '../GroupDangerousZone';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta = {
  title: 'Group/GroupDangerousZone',
  component: GroupDangerousZone,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.delete('/api/groups/:groupId', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-md mx-auto p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof GroupDangerousZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groupName: '우리 가족',
    groupId: 'group-1',
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 삭제 영역 - 기본 상태',
      },
    },
  },
};

export const LongGroupName: Story = {
  args: {
    groupName: '우리 가족의 소중한 추억 모음집',
    groupId: 'group-1',
  },
  parameters: {
    docs: {
      description: {
        story: '긴 그룹 이름인 경우',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    groupName: '우리 가족',
    groupId: 'group-1',
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
      <QueryClientProvider client={queryClient}>
        <div className="dark">
          <div className="max-w-md mx-auto p-4 bg-[#121212]">
            <Story />
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
};
