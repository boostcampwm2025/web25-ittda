import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Profile from '../Profile';

const meta = {
  title: 'Profile/Profile',
  component: Profile,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Profile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 프로필 카드 - 프로필 이미지, 이름, 이메일, 수정 버튼 포함',
      },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드 프로필 카드',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="max-w-md mx-auto p-5 bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: `
프로필 카드 기능:
- "프로필 수정" 버튼 클릭 시 /profile/edit 페이지로 이동
- Active 상태에서 scale 애니메이션
- 다크 모드 지원
        `,
      },
    },
  },
};
