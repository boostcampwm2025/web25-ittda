import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GroupInfo from '../GroupInfo';
import { GroupEditProvider } from '../GroupEditContext';
import { Member } from '@/lib/types/group';

const mockMembers: Member[] = [
  { id: 1, name: '도비', avatar: '/profile-ex.jpeg', role: 'admin' },
  { id: 2, name: '하니', avatar: '/profile-ex.jpeg', role: 'member' },
];

const meta = {
  title: 'Group/GroupInfo',
  component: GroupInfo,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <GroupEditProvider
        initialName={'우리 가족'}
        initialThumbnail=""
        initialMembers={mockMembers}
      >
        <div className="max-w-md mx-auto p-4">
          <Story />
        </div>
      </GroupEditProvider>
    ),
  ],
} satisfies Meta<typeof GroupInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    nickname: '도비',
  },
  decorators: [
    (Story) => (
      <GroupEditProvider
        initialName="우리 가족"
        initialThumbnail=""
        initialMembers={mockMembers}
      >
        <div className="max-w-md mx-auto p-4">
          <Story />
        </div>
      </GroupEditProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 정보 수정 - 기본 상태',
      },
    },
  },
};

export const LongGroupName: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    nickname: '도비',
  },
  decorators: [
    (Story) => (
      <GroupEditProvider
        initialName="우리 가족의 소중한 추억을 모아놓은 공간"
        initialThumbnail=""
        initialMembers={mockMembers}
      >
        <div className="max-w-md mx-auto p-4">
          <Story />
        </div>
      </GroupEditProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '긴 그룹 이름',
      },
    },
  },
};

export const EmptyGroupName: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    nickname: '도비',
  },
  decorators: [
    (Story) => (
      <GroupEditProvider
        initialName=""
        initialThumbnail=""
        initialMembers={mockMembers}
      >
        <div className="max-w-md mx-auto p-4">
          <Story />
        </div>
      </GroupEditProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 이름이 비어있는 경우',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    groupId: 'group-1',
    groupThumnail:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    nickname: '도비',
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
        <GroupEditProvider
          initialName="우리 가족"
          initialThumbnail=""
          initialMembers={mockMembers}
        >
          <div className="max-w-md mx-auto p-4 bg-[#121212]">
            <Story />
          </div>
        </GroupEditProvider>
      </div>
    ),
  ],
};
