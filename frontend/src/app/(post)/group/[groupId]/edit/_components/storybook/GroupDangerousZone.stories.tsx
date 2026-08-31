import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GroupDangerousZone from '../GroupDangerousZone';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GroupMember } from '@/lib/types/groupResponse';

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
    docs: {
      description: {
        component:
          '그룹 설정 페이지의 그룹 삭제 영역 컴포넌트입니다. 그룹 이름을 표시하고 "그룹 삭제" 버튼을 통해 확인 드로어를 열어 최종 삭제를 진행합니다. 관리자(admin)만 접근 가능한 영역입니다.',
      },
    },
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
        <div className="max-w-2xl mx-auto p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof GroupDangerousZone>;

export default meta;
type Story = StoryObj<typeof meta>;

const meAdmin: GroupMember = {
  userId: 'user-1',
  name: '나',
  profileImage: null,
  role: 'ADMIN',
  nicknameInGroup: '관리자',
  joinedAt: '2024-01-01T00:00:00Z',
};

const meViewer: GroupMember = {
  ...meAdmin,
  role: 'VIEWER',
  nicknameInGroup: '뷰어',
};

export const Default: Story = {
  args: {
    groupName: '우리 가족',
    groupId: 'group-1',
    me: meAdmin,
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 삭제 영역 - 기본 상태',
      },
    },
  },
};



