import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TagDashboard from '../TagDashboard';
import { TagStatSummary } from '@/lib/types/profile';
import { Tag } from '@/lib/types/record';

// TagDashboard는 props 없이 내부에서 useSuspenseQuery(userProfileTagSummaryOptions(10))만 사용한다.
// queryKey: ['profile', 'tags', 'summary', 10]
// Tag 타입: { tag: string; count: number }

// 최근 사용: 시간 역순 (count 순이 아님) → 자주 사용 탭으로 전환 시 count 순 정렬이 눈에 보임
const mockRecentTags: Tag[] = [
  { tag: '주말', count: 4 },
  { tag: '맛집', count: 7 },
  { tag: '가족', count: 5 },
  { tag: '성수동', count: 8 },
  { tag: '산책', count: 12 },
];

const mockFrequentTags: Tag[] = [
  { tag: '산책', count: 12 },
  { tag: '성수동', count: 8 },
  { tag: '맛집', count: 7 },
  { tag: '가족', count: 5 },
  { tag: '주말', count: 4 },
];

const mockTagSummary: TagStatSummary = {
  recentTags: mockRecentTags,
  frequentTags: mockFrequentTags,
};

const emptyTagSummary: TagStatSummary = {
  recentTags: [],
  frequentTags: [],
};

function makeClient(summary: TagStatSummary) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['profile', 'tags', 'summary', 10], summary);
  return client;
}

const clients = {
  default: makeClient(mockTagSummary),
  empty: makeClient(emptyTagSummary),
};

const meta = {
  title: 'Profile/TagDashboard',
  component: TagDashboard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '프로필 페이지의 태그 통계 대시보드 컴포넌트입니다. 최근 사용/자주 사용 탭으로 태그를 분류하여 표시하며, 조합 검색 드로어로 여러 태그를 선택해 기록을 필터링할 수 있습니다. "모두 보기"를 통해 태그 전체 보기 페이지(/profile/all-tags)로 이동합니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TagDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
기본 태그 대시보드 — 최근 사용 탭으로 시작
- **탭 전환**: 최근 사용 / 자주 사용 버튼 클릭으로 태그 목록 전환
- **조합 검색 버튼**: 클릭 시 드로어가 열리며 여러 태그를 선택해 기록 필터링 가능
- **모두 보기 버튼**: /profile/all-tags 페이지로 이동
- **태그 표시**: 최대 5개, 각 태그 우측에 사용 횟수 표시
        `,
      },
    },
  },
};

function FrequentTabWrapper() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent === '자주 사용',
      );
      btn?.click();
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return <TagDashboard />;
}

export const EmptyTags: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.empty}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '태그가 없는 경우 — "아직 사용한 태그가 없어요" 메시지 표시',
      },
    },
  },
};
