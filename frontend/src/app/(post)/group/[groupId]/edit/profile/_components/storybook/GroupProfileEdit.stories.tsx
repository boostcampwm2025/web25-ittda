import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GroupProfileEditClient from '../GroupProfileEditClient';
import { BaseUser } from '@/lib/types/profile';

const mockGroupProfile: Omit<BaseUser, 'email' | 'id'> = {
  nickname: '도비',
  profileImageUrl: '/profile-ex.jpeg',
};

const meta = {
  title: 'Group/GroupProfileEdit',
  component: GroupProfileEditClient,
  parameters: {
    layout: 'fullscreen',
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
  args: {
    groupId: 'group-1',
    groupProfile: mockGroupProfile,
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 프로필 수정 페이지 - 기본 상태',
      },
    },
  },
};

export const EmptyNickname: Story = {
  args: {
    groupId: 'group-1',
    groupProfile: {
      ...mockGroupProfile,
      nickname: '',
    },
  },
  parameters: {
    docs: {
      description: {
        story: '닉네임이 비어있는 경우 (저장 불가)',
      },
    },
  },
};

export const ShortNickname: Story = {
  args: {
    groupId: 'group-1',
    groupProfile: {
      ...mockGroupProfile,
      nickname: '도',
    },
  },
  parameters: {
    docs: {
      description: {
        story: '닉네임이 너무 짧은 경우 (1자, 에러 표시)',
      },
    },
  },
};

export const LongNickname: Story = {
  args: {
    groupId: 'group-1',
    groupProfile: {
      ...mockGroupProfile,
      nickname: '아주아주아주긴닉네임입니다',
    },
  },
  parameters: {
    docs: {
      description: {
        story: '닉네임이 너무 긴 경우 (10자 초과, 에러 표시)',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    groupId: 'group-1',
    groupProfile: mockGroupProfile,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="max-w-md mx-auto bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};
