import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GroupMemberManagement from '../GroupMemberManagement';
import { GroupEditProvider } from '../GroupEditContext';
import { GroupMember } from '@/lib/types/groupResponse';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockMe: GroupMember = {
  userId: 'user-1',
  name: '도비',
  profileImage: null,
  role: 'ADMIN',
  nicknameInGroup: '도비',
  joinedAt: '2024-01-01T00:00:00Z',
};

const mockMembers: GroupMember[] = [
  { userId: 'user-1', name: '도비', profileImage: null, role: 'ADMIN', nicknameInGroup: '도비', joinedAt: '2024-01-01T00:00:00Z' },
  { userId: 'user-2', name: '하니', profileImage: null, role: 'EDITOR', nicknameInGroup: '하니', joinedAt: '2024-01-01T00:00:00Z' },
  { userId: 'user-3', name: '루피', profileImage: null, role: 'EDITOR', nicknameInGroup: '루피', joinedAt: '2024-01-01T00:00:00Z' },
  { userId: 'user-4', name: '미키', profileImage: null, role: 'VIEWER', nicknameInGroup: '미키', joinedAt: '2024-01-01T00:00:00Z' },
];

const meta = {
  title: 'Group/GroupMemberManagement',
  component: GroupMemberManagement,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '그룹 설정 페이지의 멤버 목록과 역할 관리 컴포넌트입니다. 그룹 멤버를 아바타/닉네임/역할과 함께 목록으로 표시하며, 관리자는 멤버 역할 변경 및 내보내기를 할 수 있습니다.',
      },
    },
    msw: {
      handlers: [
        http.delete('/api/groups/:groupId/members/:memberId', () => {
          return HttpResponse.json({ success: true });
        }),
        http.patch('/api/groups/:groupId/members/:memberId/role', () => {
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
    groupId: 'group-1',
    me: mockMe,
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GroupEditProvider
          initialName="우리 가족"
          initialThumbnail={{ assetId: '', postId: '' }}
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
그룹 멤버 관리 — ADMIN 권한 기본 상태.

- **역할 텍스트 클릭**: 역할 변경 드로어가 열려 ADMIN/멤버/뷰어 선택 가능
- **내보내기 버튼 클릭**: 해당 멤버 내보내기 확인 드로어 표시
- **관리자 본인**: 내보내기 버튼 비표시 (자기 자신은 내보낼 수 없음)
        `,
      },
    },
  },
};

export const FewMembers: Story = {
  args: {
    groupId: 'group-1',
    me: mockMe,
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GroupEditProvider
          initialName="우리 가족"
          initialThumbnail={{ assetId: '', postId: '' }}
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
    groupId: 'group-1',
    me: mockMe,
  },
  decorators: [
    (Story) => {
      const manyMembers: GroupMember[] = [
        ...mockMembers,
        { userId: 'user-5', name: '피카츄', profileImage: null, role: 'EDITOR', nicknameInGroup: '피카츄', joinedAt: '2024-01-01T00:00:00Z' },
        { userId: 'user-6', name: '라이츄', profileImage: null, role: 'EDITOR', nicknameInGroup: '라이츄', joinedAt: '2024-01-01T00:00:00Z' },
        { userId: 'user-7', name: '파이리', profileImage: null, role: 'VIEWER', nicknameInGroup: '파이리', joinedAt: '2024-01-01T00:00:00Z' },
      ];
      return (
        <QueryClientProvider client={queryClient}>
          <GroupEditProvider
            initialName="우리 가족"
            initialThumbnail={{ assetId: '', postId: '' }}
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
        story: '멤버가 많은 경우 (7명)',
      },
    },
  },
};
