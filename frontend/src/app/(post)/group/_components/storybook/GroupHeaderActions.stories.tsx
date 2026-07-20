import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupHeaderActions from '../GroupHeaderActions';
import {
  GroupMembersResponse,
  GroupMemberRoleResponse,
} from '@/lib/types/groupResponse';

const GROUP_ID = 'group-1';

function makeClient(groupId: string, role: GroupMemberRoleResponse['role']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  // groupMyRoleOptions queryKey: ['group', groupId, 'me', 'role']
  client.setQueryData(['group', groupId, 'me', 'role'], { role });
  return client;
}

const LONG_NAME_GROUP_ID = 'long-name';

// 스토리별 독립 QueryClient — 공유 캐시로 인한 role 오염 방지
const clients = {
  admin: makeClient(GROUP_ID, 'ADMIN'),
  viewer: makeClient(GROUP_ID, 'VIEWER'),
  longName: makeClient(LONG_NAME_GROUP_ID, 'ADMIN'),
  manyMembers: makeClient(GROUP_ID, 'ADMIN'),
  muted: makeClient(GROUP_ID, 'ADMIN'),
};
clients.muted.setQueryData(['group', GROUP_ID, 'me', 'role'], {
  role: 'ADMIN',
  notificationMuted: true,
});

const baseMembers = [
  { memberId: 'user-1', profileImageId: null },
  { memberId: 'user-2', profileImageId: null },
  { memberId: 'user-3', profileImageId: null },
];

const manyMembersList = Array.from({ length: 12 }, (_, i) => ({
  memberId: `user-${i + 1}`,
  profileImageId: null,
}));

const defaultGroupInfo: GroupMembersResponse = {
  groupName: '우리 가족 추억함',
  groupMemberCount: 3,
  members: baseMembers,
};

const longNameGroupInfo: GroupMembersResponse = {
  groupName:
    '우리 가족의 아주아주 길고 소중한 2026년 추억 보관함 (말줄임표 확인용)',
  groupMemberCount: 3,
  members: baseMembers,
};

const manyMembersGroupInfo: GroupMembersResponse = {
  groupName: '대가족 모임',
  groupMemberCount: 12,
  members: manyMembersList,
};

const meta = {
  title: 'Group/GroupHeader',
  component: GroupHeaderActions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '그룹 홈 헤더 컴포넌트입니다. 그룹 이름, 멤버 초대(비뷰어만), 날짜 선택, 그룹 메뉴(설정/프로필/탈퇴)를 포함합니다. groupInfo prop으로 그룹 정보를 받고, 내부적으로 현재 사용자의 role을 조회해 UI를 분기합니다.',
      },
    },
    nextjs: {
      navigation: { pathname: `/group/${GROUP_ID}` },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GroupHeaderActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { groupInfo: defaultGroupInfo },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.admin}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
그룹 헤더 기본 뷰 — ADMIN 권한으로 모든 메뉴 표시.

- **초대 버튼 클릭**: 멤버 초대 드로어가 열려 초대 코드 생성 및 공유 가능
- **달력 아이콘 클릭**: 날짜 선택 드로어로 특정 날짜의 기록 이동
- **더보기(⋮) 클릭**: 그룹 정보 수정 / 나의 그룹 프로필 / 멤버 관리 / 그룹 나가기 팝오버 표시
        `,
      },
    },
  },
};

export const LongGroupName: Story = {
  args: { groupInfo: longNameGroupInfo },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.longName}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 이름이 매우 긴 경우 — 말줄임표 처리 확인',
      },
    },
    nextjs: {
      navigation: { pathname: `/group/${LONG_NAME_GROUP_ID}` },
    },
  },
};

export const NotificationMuted: Story = {
  args: { groupInfo: defaultGroupInfo },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.muted}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 알림이 꺼진 상태 — 벨 아이콘이 BellOff로 표시됨',
      },
    },
  },
};

export const ViewerRole: Story = {
  args: { groupInfo: defaultGroupInfo },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.viewer}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'VIEWER 권한 — 초대 버튼이 숨겨지고 그룹 정보 수정·멤버 관리 메뉴가 비표시',
      },
    },
  },
};
