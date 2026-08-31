import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MonthlyDetailRecords from '../MonthlyDetailRecords';
import { createMockDailyRecord, createMockGroupDailyRecords } from '@/lib/mocks/mock';

// MonthlyDetailRecords는 내부에서 useSuspenseQuery로 데이터를 fetching한다.
// setQueryData의 키는 각 queryOptions의 queryKey와 정확히 일치해야 한다.
// select 변환(convertDayRecords)은 TanStack Query가 자동으로 적용한다.

const MONTH = '2025-01';
const GROUP_ID = 'group-123';

function makeClient({ isGroup = false, empty = false }: { isGroup?: boolean; empty?: boolean } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const data = empty ? [] : isGroup ? createMockGroupDailyRecords() : createMockDailyRecord();

  if (isGroup) {
    client.setQueryData(['group', GROUP_ID, 'records', 'daily', MONTH], data);
  } else {
    client.setQueryData(['my', 'records', 'daily', MONTH], data);
  }

  return client;
}

const clients = {
  default: makeClient(),
  group: makeClient({ isGroup: true }),
  few: (() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    c.setQueryData(['my', 'records', 'daily', MONTH], createMockDailyRecord().slice(0, 2));
    return c;
  })(),
  single: (() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    c.setQueryData(['my', 'records', 'daily', MONTH], createMockDailyRecord().slice(0, 1));
    return c;
  })(),
  empty: makeClient({ empty: true }),
};

const meta = {
  title: 'Record/MonthlyDetailRecords',
  component: MonthlyDetailRecords,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
월별 상세 페이지의 일별 기록 카드 그리드 컴포넌트.

해당 월의 기록을 날짜별 카드로 표시하며, 카드 클릭 시 해당 날짜의 일별 상세 페이지(\`routePath/{날짜}\`)로 이동한다.
하단의 지도 보기 버튼으로 해당 월의 기록을 지도에서 확인할 수 있다.
기록이 없는 경우 빈 상태 UI를 표시한다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    month: { description: '조회할 월 (YYYY-MM 형식)' },
    routePath: { description: '날짜 카드 클릭 시 이동할 기본 경로. 뒤에 /{날짜}가 붙는다.' },
    viewMapRoutePath: { description: '지도 보기 버튼 클릭 시 이동할 경로.' },
    groupId: { description: '그룹 기록함이면 그룹 ID를 전달. 없으면 개인 기록함.' },
  },
} satisfies Meta<typeof MonthlyDetailRecords>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { month: MONTH, routePath: '/my/detail', viewMapRoutePath: `/my/map/month/${MONTH}` },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="max-w-2xl mx-auto min-h-[500px] p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: { description: { story: '개인 기록함 — 월별 상세 일별 카드 그리드' } },
  },
};

export const GroupRecords: Story = {
  args: { month: MONTH, routePath: `/group/${GROUP_ID}/detail`, viewMapRoutePath: `/group/${GROUP_ID}/map/month/${MONTH}`, groupId: GROUP_ID },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.group}>
        <div className="max-w-2xl mx-auto min-h-[500px] p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: { description: { story: '그룹 기록함 — 월별 상세 일별 카드 그리드' } },
  },
};

export const EmptyRecords: Story = {
  args: { month: MONTH, routePath: '/my/detail', viewMapRoutePath: `/my/map/month/${MONTH}` },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.empty}>
        <div className="max-w-2xl mx-auto min-h-[500px] p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: { description: { story: '기록이 없는 경우 — 빈 상태 UI 표시' } },
  },
};

