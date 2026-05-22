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
    docs: {
      description: {
        component:
          '그룹 설정 페이지의 멤버 목록과 역할 관리 컴포넌트입니다. 그룹 멤버를 아바타/닉네임/역할과 함께 목록으로 표시하며, 관리자는 멤버 추방 버튼을 통해 멤버를 내보낼 수 있습니다. 멤버 추방 시 DELETE API를 호출합니다.',
      },
    },
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

export const Interactive: Story = {
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
        story: `
- **추방 버튼 클릭**: 해당 멤버에게 추방 확인 드로어 표시
- **추방 확인**: "추방하기" 버튼 클릭 시 DELETE API 호출 후 목록에서 제거
- **관리자(admin)**: 추방 버튼이 비활성화되어 자신을 추방할 수 없음
        `,
      },
    },
  },
};

