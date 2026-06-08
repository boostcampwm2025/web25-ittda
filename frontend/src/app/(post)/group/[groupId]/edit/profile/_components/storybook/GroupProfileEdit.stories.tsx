import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupProfileEditClient from '../GroupProfileEditClient';
import { GroupEditResponse } from '@/lib/types/groupResponse';

const baseMockData: GroupEditResponse = {
  group: {
    groupId: 'group-1',
    name: '우리 가족',
    createdAt: '2024-01-01T00:00:00Z',
    ownerUserId: 'user-1',
    cover: null,
  },
  me: {
    userId: 'user-1',
    name: '도비',
    profileImage: null,
    role: 'EDITOR',
    nicknameInGroup: '도비',
    joinedAt: '2024-01-01T00:00:00Z',
  },
  members: [],
};

function makeClient(overrideMe?: Partial<GroupEditResponse['me']>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['group', 'group-1', 'edit'], {
    ...baseMockData,
    me: { ...baseMockData.me, ...overrideMe },
  });
  return client;
}

// 스토리별 독립적인 QueryClient 인스턴스
const clients = {
  default: makeClient(),
  emptyNickname: makeClient({ nicknameInGroup: '' }),
  shortNickname: makeClient({ nicknameInGroup: '도' }),
  longNickname: makeClient({ nicknameInGroup: '아주아주아주긴닉네임입니다' }),
};

const meta = {
  title: 'Group/GroupProfileEdit',
  component: GroupProfileEditClient,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '그룹 내 내 프로필(닉네임/이미지) 편집 페이지 컴포넌트입니다. 그룹 전용 닉네임과 프로필 이미지를 변경할 수 있으며, 닉네임 유효성 검사(2~10자)를 포함합니다. groupId를 받아 내부적으로 그룹 데이터를 조회합니다.',
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/group/group-1/edit/profile',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GroupProfileEditClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { groupId: 'group-1' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <Suspense fallback={<div>로딩 중...</div>}>
          <Story />
        </Suspense>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
그룹 프로필 수정 페이지 — 기본 상태.

- **프로필 이미지 클릭**: 이미지 파일 선택 피커가 열리며, 선택 즉시 미리보기 업데이트
- **닉네임 입력**: 실시간 입력, 2자 미만 또는 10자 초과 시 에러 메시지 표시
- **저장 버튼**: 유효성 통과 시 활성화, 클릭 시 변경 사항을 서버에 저장
- **뒤로가기**: 저장하지 않고 이전 페이지로 이동
        `,
      },
    },
  },
};

export const EmptyNickname: Story = {
  args: { groupId: 'group-1' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.emptyNickname}>
        <Suspense fallback={<div>로딩 중...</div>}>
          <Story />
        </Suspense>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '닉네임이 비어있는 경우 — 저장 불가',
      },
    },
  },
};

export const ShortNickname: Story = {
  args: { groupId: 'group-1' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.shortNickname}>
        <Suspense fallback={<div>로딩 중...</div>}>
          <Story />
        </Suspense>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '닉네임이 너무 짧은 경우 (1자) — 에러 표시',
      },
    },
  },
};

export const LongNickname: Story = {
  args: { groupId: 'group-1' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.longNickname}>
        <Suspense fallback={<div>로딩 중...</div>}>
          <Story />
        </Suspense>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '닉네임이 너무 긴 경우 (10자 초과) — 에러 표시',
      },
    },
  },
};
