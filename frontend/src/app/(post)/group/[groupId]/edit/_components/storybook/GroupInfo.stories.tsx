import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupInfo from '../GroupInfo';
import { GroupEditProvider } from '../GroupEditContext';
import { GroupMember } from '@/lib/types/groupResponse';

// 커버 이미지 클릭 시 GalleryDrawer가 열리고 내부에서 useInfiniteQuery를 사용하므로
// QueryClientProvider가 필요하다.

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

const mockMembers: GroupMember[] = [
  { userId: 'user-1', name: '도비', profileImage: null, role: 'ADMIN', nicknameInGroup: '도비', joinedAt: '2024-01-01T00:00:00Z' },
  { userId: 'user-2', name: '하니', profileImage: null, role: 'EDITOR', nicknameInGroup: '하니', joinedAt: '2024-01-01T00:00:00Z' },
];

const meAdmin: GroupMember = {
  userId: 'user-1',
  name: '도비',
  profileImage: null,
  role: 'ADMIN',
  nicknameInGroup: '도비',
  joinedAt: '2024-01-01T00:00:00Z',
};

const meViewer: GroupMember = {
  ...meAdmin,
  role: 'VIEWER',
  nicknameInGroup: '뷰어',
};

function Wrapper({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GroupEditProvider initialName={name} initialThumbnail={{ assetId: '', postId: '' }} initialMembers={mockMembers}>
        <div className="max-w-2xl mx-auto p-4 bg-[#F9F9F9] dark:bg-[#121212]">
          {children}
        </div>
      </GroupEditProvider>
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Group/GroupInfo',
  component: GroupInfo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '그룹 설정 페이지의 그룹명/커버 편집 폼 컴포넌트입니다. 그룹 커버 이미지 변경, 그룹명 입력(유효성 검사 포함), 저장 버튼을 제공합니다. GroupEditProvider 컨텍스트를 통해 편집 상태를 관리합니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GroupInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    me: meAdmin,
  },
  decorators: [
    (Story) => (
      <Wrapper name="우리 가족">
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
그룹 정보 수정 — 기본 상태 (ADMIN 권한)
- **커버 이미지 클릭**: 이미지 선택 드로어가 열려 커버 변경 가능
- **그룹명 편집 버튼 클릭**: 입력 필드 활성화, 빈 값 또는 2자 미만이면 저장 버튼 비활성화
- **저장 버튼**: 변경 사항을 서버에 저장
        `,
      },
    },
  },
};

export const LongGroupName: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    me: meAdmin,
  },
  decorators: [
    (Story) => (
      <Wrapper name="우리 가족의 소중한 추억을 모아놓은 공간">
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '긴 그룹 이름 — 입력 길이 초과 시 유효성 에러 표시',
      },
    },
  },
};

export const EmptyGroupName: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    me: meAdmin,
  },
  decorators: [
    (Story) => (
      <Wrapper name="">
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 이름이 비어있는 경우 — 저장 버튼 비활성화',
      },
    },
  },
};

export const ViewerRole: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    me: meViewer,
  },
  decorators: [
    (Story) => (
      <Wrapper name="우리 가족">
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'VIEWER 권한 — 커버 이미지 클릭 불가, 그룹명 편집 버튼 비표시',
      },
    },
  },
};
