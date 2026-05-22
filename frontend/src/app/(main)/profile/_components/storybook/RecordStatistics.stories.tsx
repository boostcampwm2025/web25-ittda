import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecordStatistics from '../RecordStatistics';
import { UserProfileResponse } from '@/lib/types/profileResponse';
import { EmotionStatSummary } from '@/lib/types/profile';

// RecordStatistics가 렌더링하는 자식 컴포넌트들이 사용하는 queryKey:
//   - WritingRecordStatistics / MonthlyUsageChart / PlaceDashboard: ['profile', 'me']
//   - EmotionDashboard: ['profile', 'emotions', 'summary', 10]

const mockProfile: UserProfileResponse = {
  userId: 'user-1',
  user: {
    id: 'user-1',
    email: 'hello@example.com',
    nickname: '도비',
    profileImageId: null,
    provider: 'google',
    providerId: 'google-123',
    profileImage: undefined,
    settings: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  stats: {
    recentTags: ['카페', '산책', '맛집'],
    frequentTags: ['카페', '산책'],
    recentEmotions: ['😊', '😄'],
    frequentEmotions: ['😊'],
    totalPosts: 42,
    totalImages: 15,
    frequentLocations: [
      { placeName: '한강공원', count: 8 },
      { placeName: '성수동 카페', count: 5 },
      { placeName: '홍대 거리', count: 3 },
    ],
    monthlyCounts: [
      { month: '2025-01', count: 5 },
      { month: '2025-02', count: 8 },
      { month: '2025-03', count: 3 },
      { month: '2025-04', count: 10 },
      { month: '2025-05', count: 7 },
      { month: '2025-06', count: 7 },
    ],
  },
};

const mockEmotions: EmotionStatSummary = {
  totalCount: 42,
  emotion: [
    { emotion: '행복', count: 18 },
    { emotion: '만족', count: 10 },
    { emotion: '보통', count: 8 },
    { emotion: '피곤', count: 4 },
    { emotion: '슬픔', count: 2 },
  ],
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['profile', 'me'], mockProfile);
  client.setQueryData(['profile', 'emotions', 'summary', 10], mockEmotions);
  return client;
}

const clients = {
  default: makeClient(),
};

const meta = {
  title: 'Profile/RecordStatistics',
  component: RecordStatistics,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '프로필 페이지의 기록 통계 섹션 컴포넌트입니다. 작성 기록 요약(WritingRecordStatistics)을 기본으로 표시하고, "통계 더보기" 버튼을 통해 월별 사용 차트·장소 대시보드·감정 대시보드를 펼쳐 볼 수 있습니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecordStatistics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
기본 상태 — 작성 기록 통계만 표시됩니다.
- **통계 더보기 버튼**: 클릭 시 월별 사용 차트·장소 대시보드·감정 대시보드가 펼쳐짐
- **접기 버튼**: 펼쳐진 상태에서 클릭 시 상세 통계 영역이 접힘
        `,
      },
    },
  },
};

// 상세 통계가 펼쳐진 상태를 보여주는 래퍼
function ExpandedWrapper() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('통계 더보기'),
      );
      btn?.click();
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return <RecordStatistics />;
}

