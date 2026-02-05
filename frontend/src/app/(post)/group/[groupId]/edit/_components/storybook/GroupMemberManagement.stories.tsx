import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GroupMemberManagement from '../GroupMemberManagement';
import { GroupEditProvider } from '../GroupEditContext';
import { Member } from '@/lib/types/group';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockMembers: Member[] = [
  { id: 1, name: '도비', avatar: '/profile-ex.jpeg', role: 'admin' },
  { id: 2, name: '하니', avatar: '/profile-ex.jpeg', role: 'member' },
  { id: 3, name: '루피', avatar: '/profile-ex.jpeg', role: 'member' },
  { id: 4, name: '미키', avatar: '/profile-ex.jpeg', role: 'member' },
];

const meta = {
  title: 'Group/GroupMemberManagement',
  component: GroupMemberManagement,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.delete('/api/:groupId/members/:memberId', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GroupMemberManagement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    members: mockMembers,
    groupId: 'group-1',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GroupEditProvider
          initialName="우리 가족"
          initialThumbnail=""
          initialMembers={mockMembers}
        >
          <div className="max-w-md mx-auto p-4">
            <Story />
          </div>
        </GroupEditProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 멤버 관리 - 기본 상태 (관리자 뷰)',
      },
    },
  },
};

export const FewMembers: Story = {
  args: {
    members: mockMembers.slice(0, 2),
    groupId: 'group-1',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GroupEditProvider
          initialName="우리 가족"
          initialThumbnail=""
          initialMembers={mockMembers.slice(0, 2)}
        >
          <div className="max-w-md mx-auto p-4">
            <Story />
          </div>
        </GroupEditProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '멤버가 적은 경우 (2명)',
      },
    },
  },
};

export const ManyMembers: Story = {
  args: {
    members: [
      ...mockMembers,
      { id: 5, name: '피카츄', avatar: '/profile-ex.jpeg', role: 'member' },
      { id: 6, name: '라이츄', avatar: '/profile-ex.jpeg', role: 'member' },
      { id: 7, name: '파이리', avatar: '/profile-ex.jpeg', role: 'member' },
    ],
    groupId: 'group-1',
  },
  decorators: [
    (Story) => {
      const manyMembers: Member[] = [
        ...mockMembers,
        { id: 5, name: '피카츄', avatar: '/profile-ex.jpeg', role: 'member' },
        { id: 6, name: '라이츄', avatar: '/profile-ex.jpeg', role: 'member' },
        { id: 7, name: '파이리', avatar: '/profile-ex.jpeg', role: 'member' },
      ];
      return (
        <QueryClientProvider client={queryClient}>
          <GroupEditProvider
            initialName="우리 가족"
            initialThumbnail=""
            initialMembers={manyMembers}
          >
            <div className="max-w-md mx-auto p-4">
              <Story />
            </div>
          </GroupEditProvider>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: '멤버가 많은 경우',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    members: mockMembers,
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
          <GroupEditProvider
            initialName="우리 가족"
            initialThumbnail=""
            initialMembers={mockMembers}
          >
            <div className="max-w-md mx-auto p-4 bg-[#121212]">
              <Story />
            </div>
          </GroupEditProvider>
        </div>
      </QueryClientProvider>
    ),
  ],
};
