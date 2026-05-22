import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '../Header';
import { UserProfileResponse } from '@/lib/types/profileResponse';

const mockProfileBase: UserProfileResponse = {
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
    recentTags: ['카페', '산책'],
    frequentTags: ['카페'],
    recentEmotions: [],
    frequentEmotions: [],
    totalPosts: 42,
    totalImages: 15,
    frequentLocations: [],
    monthlyCounts: [],
  },
};

const PROFILE_IMAGE_URL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80';

const mockProfileWithImage: UserProfileResponse = {
  ...mockProfileBase,
  user: {
    ...mockProfileBase.user,
    profileImageId: PROFILE_IMAGE_URL,
    profileImage: { url: PROFILE_IMAGE_URL },
  },
};

function makeClient(profile: UserProfileResponse) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['profile', 'me'], profile);
  return client;
}

const clients = {
  noImage: makeClient(mockProfileBase),
  withImage: makeClient(mockProfileWithImage),
};

const meta = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component: `
모든 주요 페이지 상단에 고정되는 헤더 컴포넌트.

좌측 "잇다-" 로고 클릭 시 홈으로 이동하고,
우측에 검색 아이콘과 프로필 이미지(원형) 버튼이 표시된다.

- **검색 아이콘**: \`/search\` 페이지로 이동
- **프로필 아이콘**: \`/profile\` 페이지로 이동
- 프로필 이미지가 없으면 기본 이미지(\`profile_base.png\`)가 표시된다
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.noImage}>
        <div className="bg-[#F9F9F9] dark:bg-[#121212] min-h-20">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
프로필 이미지가 없는 기본 상태 — 기본 이미지로 표시된다.

- **"잇다-" 클릭**: 홈(\`/\`)으로 이동
- **돋보기 클릭**: 검색(\`/search\`)으로 이동
- **프로필 아이콘 클릭**: 프로필(\`/profile\`)로 이동
        `,
      },
    },
  },
};

export const WithProfileImage: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.withImage}>
        <div className="bg-[#F9F9F9] dark:bg-[#121212] min-h-20">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '프로필 이미지가 있는 상태 — 우측 아이콘에 실제 프로필 사진이 표시된다.',
      },
    },
  },
};
