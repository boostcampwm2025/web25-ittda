import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupHeader from '../GroupHeader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// --- Mock Data 생성 ---
const baseMembers = [
  { id: 1, name: '나', avatar: '/profile-ex.jpeg' },
  { id: 2, name: '엄마', avatar: '/profile-ex.jpeg' },
  { id: 3, name: '아빠', avatar: '/profile-ex.jpeg' },
];

const manyMembers = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `멤버 ${i + 1}`,
  avatar: '/profile-ex.jpeg',
}));

const meta = {
  title: 'Group/GroupHeader',
  component: GroupHeader,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        // 호출되는 API 주소에 따라 다른 데이터를 반환하도록 설정
        http.get('/api/groups/:groupId', ({ params }) => {
          const { groupId } = params;

          if (groupId === 'long-name') {
            return HttpResponse.json({
              name: '우리 가족의 아주아주 길고 소중한 2026년 추억 보관함 (말줄임표 확인용)',
              inviteCode: 'LONG-NAME-TEST',
              members: baseMembers,
            });
          }

          if (groupId === 'many-members') {
            return HttpResponse.json({
              name: '대가족 모임',
              inviteCode: 'BIG-FAMILY-77',
              members: manyMembers,
            });
          }

          // Default 데이터
          return HttpResponse.json({
            name: '우리 가족 추억함',
            inviteCode: 'DLOG-FAMILY-99',
            members: baseMembers,
          });
        }),
      ],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof GroupHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '그룹 헤더 - 기본 뷰',
      },
    },
  },
};

export const LongGroupName: Story = {
  parameters: {
    docs: {
      description: {
        story: '그룹 이름이 매우 긴 경우',
      },
    },
    layout: 'padded',
    nextjs: {
      navigation: { pathname: '/group/long-name' },
    },
  },
};

export const ManyMembers: Story = {
  parameters: {
    layout: 'padded',
    nextjs: {
      navigation: { pathname: '/group/many-members' },
    },
    docs: {
      description: {
        story: '멤버가 5명 이상인 경우',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    className: 'dark',
  },
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드',
      },
    },
  },
  render: (args) => (
    <div className="dark bg-[#121212]">
      <div className="mx-auto">
        <GroupHeader {...args} />
      </div>
    </div>
  ),
};
