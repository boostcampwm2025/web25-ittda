import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MonthRecords from '../MonthRecords';
import { createMockMonthlyRecord, createMockGroupMonthlyRecords } from '@/lib/mocks/mock';

// MonthRecords는 내부에서 useSuspenseQuery로 데이터를 직접 fetching한다.
// Storybook에서 인증/네트워크 없이 렌더링하려면 queryClient에 데이터를 미리 주입한다.
// setQueryData의 키는 각 queryOptions의 queryKey와 정확히 일치해야 한다.

// 컴포넌트는 useParams().year || 현재연도 로 year를 결정한다.
// Storybook에서 useParams()는 {} 반환 → year = 현재 연도
const CURRENT_YEAR = new Date().getFullYear().toString();
const GROUP_ID = 'group-123';

function makeClient({
  isGroup = false,
  empty = false,
}: { isGroup?: boolean; empty?: boolean } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const monthData = empty ? [] : isGroup ? createMockGroupMonthlyRecords() : createMockMonthlyRecord();

  if (isGroup) {
    // groupMonthlyRecordListOptions의 queryKey
    client.setQueryData(['group', GROUP_ID, 'records', 'month', CURRENT_YEAR], monthData);
    // groupMyRoleOptions의 queryKey — ADMIN으로 설정해 커버 변경 버튼 표시
    client.setQueryData(['group', GROUP_ID, 'me', 'role'], { role: 'ADMIN' });
  } else {
    // myMonthlyRecordListOptions의 queryKey
    client.setQueryData(['my', 'records', 'month', CURRENT_YEAR], monthData);
  }

  return client;
}

const clients = {
  default: makeClient(),
  group: makeClient({ isGroup: true }),
  empty: makeClient({ empty: true }),
};

const meta = {
  title: 'Record/MonthRecords',
  component: MonthRecords,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
아카이브 페이지의 월별 기록 카드 그리드 컴포넌트.

각 월의 커버 이미지, 기록 수, 최신 제목과 위치를 카드 형태로 표시한다.
카드 클릭 시 해당 월의 상세 페이지(\`cardRoute/{월}\`)로 이동한다.
카드 우상단의 커버 변경 버튼을 클릭하면 GalleryDrawer가 열려 커버 이미지를 선택할 수 있다.
기록이 없는 경우 빈 상태 UI를 표시한다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    cardRoute: { description: '카드 클릭 시 이동할 기본 경로. 뒤에 /{월ID}가 붙는다.' },
    groupId: { description: '그룹 기록함이면 그룹 ID를 전달. 없으면 개인 기록함.' },
    drawerClassName: { description: 'GalleryDrawer DrawerContent에 추가할 클래스.' },
  },
} satisfies Meta<typeof MonthRecords>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { cardRoute: '/my/month' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: { story: '개인 기록함 — 월별 기록 카드 그리드' },
    },
  },
};

export const GroupRecords: Story = {
  args: { cardRoute: `/group/${GROUP_ID}/month`, groupId: GROUP_ID },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.group}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: { story: '그룹 기록함 — 그룹 월별 기록 카드 그리드' },
    },
  },
};

export const EmptyRecords: Story = {
  args: { cardRoute: '/my/month' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.empty}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: { story: '기록이 없는 경우 — 빈 상태 UI(아이콘 + 기록 추가하기 버튼) 표시' },
    },
  },
};

