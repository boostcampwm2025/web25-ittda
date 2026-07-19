import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from '../Profile';
import { UserProfileResponse } from '@/lib/types/profileResponse';

// Profile은 내부에서 useSuspenseQuery(userProfileOptions())로 사용자 정보를 가져온다.
// queryKey: ['profile', 'me']

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
    frequentLocations: [],
    monthlyCounts: [],
  },
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['profile', 'me'], mockProfile);
  return client;
}

const clients = {
  default: makeClient(),
};

const meta = {
  title: 'Profile/Profile',
  component: Profile,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '프로필 페이지의 사용자 정보 카드 컴포넌트입니다. 프로필 이미지(없으면 기본 이미지), 닉네임, 이메일을 표시하며 "프로필 수정" 버튼 클릭 시 `/profile/edit`으로 이동합니다. 내부에서 `userProfileOptions`로 사용자 데이터를 직접 fetching합니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Profile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="h-20 animate-pulse rounded-2xl bg-gray-100" />}>
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
기본 프로필 카드 — 프로필 이미지, 닉네임, 이메일, 수정 버튼 포함
- **프로필 수정 버튼**: 클릭 시 \`/profile/edit\`으로 이동
- **프로필 이미지 없음**: \`profileImageId\`가 null이면 기본 이미지(\`/profile_base.png\`) 표시
        `,
      },
    },
  },
};

