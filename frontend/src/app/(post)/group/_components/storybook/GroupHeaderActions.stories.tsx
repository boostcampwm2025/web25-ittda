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
    docs: {
      description: {
        component:
          '그룹 홈 헤더의 멤버 아바타와 설정 버튼 컴포넌트입니다. 그룹 이름, 참여 멤버 아바타(최대 표시 후 +N 처리), 그룹 설정 페이지 이동 버튼을 포함합니다. MSW를 통해 그룹 정보를 목킹하며 groupId 기반으로 데이터를 가져옵니다.',
      },
    },
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

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: `
- **멤버 아바타 클릭**: 멤버 목록 상세 또는 프로필 페이지로 이동
- **멤버 +N 표시**: 최대 노출 수 초과 시 나머지 멤버 수를 +N으로 축약 표시
- **설정 버튼 클릭**: 그룹 설정 페이지로 이동
- **그룹 이름 말줄임**: 이름이 길면 말줄임 처리(LongGroupName 스토리 참고)
        `,
      },
    },
  },
};

