import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupMainTabs from '../GroupMainTabs';
import { createMockRecordPreviews } from '@/lib/mocks/mock';

const GROUP_ID = 'group-1';

const mockMonthlyRecords = [
  { month: '2026-06', count: 5, coverAssetId: null, latestTitle: '가족 나들이', latestLocation: '서울 성동구' },
  { month: '2026-05', count: 3, coverAssetId: null, latestTitle: '생일 파티', latestLocation: null },
  { month: '2026-04', count: 8, coverAssetId: null, latestTitle: '벚꽃 나들이', latestLocation: '여의도' },
];

const mockFeedRecords = {
  success: true,
  data: createMockRecordPreviews('2026-06-05').slice(0, 2),
  error: null,
};

const mockRole = { role: 'ADMIN' };

const currentYear = new Date().getFullYear().toString();

function makeClient(members: { memberId: string; profileImageId: string | null }[], groupName: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['currentMembers', GROUP_ID], {
    groupName,
    groupMemberCount: members.length,
    members,
  });
  client.setQueryData(['group', GROUP_ID, 'me', 'role'], mockRole);
  // MonthRecords는 useParams().year || currentYear 를 queryKey에 포함함
  client.setQueryData(['group', GROUP_ID, 'records', 'month', currentYear], mockMonthlyRecords);
  return client;
}

const smallMembers = [
  { memberId: 'user-1', profileImageId: null },
  { memberId: 'user-2', profileImageId: null },
  { memberId: 'user-3', profileImageId: null },
];

const manyMembers = Array.from({ length: 6 }, (_, i) => ({
  memberId: `user-${i + 1}`,
  profileImageId: null,
}));

const clients = {
  feed: makeClient(smallMembers, '우리 가족 추억함'),
  archive: makeClient(smallMembers, '우리 가족 추억함'),
  manyMembers: makeClient(manyMembers, '대가족 모임'),
};

const feedHandlers = [
  http.get('/api/feed/groups/:groupId', () => HttpResponse.json(mockFeedRecords)),
];

const meta = {
  title: 'Group/GroupMainTabs',
  component: GroupMainTabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '그룹 홈의 메인 컨텐츠 영역입니다. 상단에 그룹 멤버 아바타 목록과 피드/보관함 탭 전환 버튼이 있으며, 탭에 따라 주간 캘린더+기록 피드(피드 탭) 또는 올해 월별 기록(보관함 탭)을 표시합니다.',
      },
    },
    msw: { handlers: feedHandlers },
    nextjs: { navigation: { pathname: `/group/${GROUP_ID}` } },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GroupMainTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FeedTab: Story = {
  args: { groupId: GROUP_ID },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.feed}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
피드 탭 — 주간 캘린더 + 날짜별 기록 목록.

- **피드/보관함 탭**: 탭 클릭 시 URL의 \`tab\` 쿼리 파라미터가 변경되어 뷰가 전환됨 (보관함 탭은 ArchiveTab 스토리에서 확인)
- **멤버 아바타**: 최대 4명 표시, 초과 시 +N 배지 (ManyMembers 스토리에서 확인)
        `,
      },
    },
  },
};

export const ArchiveTab: Story = {
  args: { groupId: GROUP_ID },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.archive}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '보관함 탭 — 올해의 월별 기록 카드 목록. 월 카드를 클릭하면 해당 월의 기록 상세로 이동',
      },
    },
    nextjs: {
      navigation: {
        pathname: `/group/${GROUP_ID}`,
        query: { tab: 'archive' },
      },
    },
  },
};

export const ManyMembers: Story = {
  args: { groupId: GROUP_ID },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.manyMembers}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '멤버가 4명을 초과하는 경우 — 아바타 4개 + +N 배지 표시',
      },
    },
  },
};
