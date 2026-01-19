import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import EmotionList from '../EmotionList';
import { ProfileEmotion } from '@/lib/types/profile';

const meta = {
  title: 'Profile/AllEmotions/EmotionList',
  component: EmotionList,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmotionList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEmotions: ProfileEmotion = {
  recent: [
    { name: '행복', emoji: '😊', count: 15 },
    { name: '설렘', emoji: '🥰', count: 12 },
    { name: '평온', emoji: '😌', count: 10 },
    { name: '뿌듯', emoji: '😎', count: 8 },
    { name: '감사', emoji: '🙏', count: 7 },
    { name: '기쁨', emoji: '😄', count: 5 },
    { name: '만족', emoji: '😁', count: 4 },
    { name: '즐거움', emoji: '😆', count: 3 },
  ],
  frequent: [
    { name: '평온', emoji: '😌', count: 45 },
    { name: '행복', emoji: '😊', count: 38 },
    { name: '감사', emoji: '🙏', count: 32 },
    { name: '기쁨', emoji: '😄', count: 28 },
    { name: '뿌듯', emoji: '😎', count: 25 },
    { name: '설렘', emoji: '🥰', count: 22 },
    { name: '만족', emoji: '😁', count: 18 },
    { name: '즐거움', emoji: '😆', count: 15 },
  ],
  all: [],
};

const fewEmotions: ProfileEmotion = {
  recent: [
    { name: '행복', emoji: '😊', count: 3 },
    { name: '설렘', emoji: '🥰', count: 2 },
  ],
  frequent: [
    { name: '평온', emoji: '😌', count: 5 },
    { name: '감사', emoji: '🙏', count: 4 },
  ],
  all: [],
};

const emptyEmotions: ProfileEmotion = {
  recent: [],
  frequent: [],
  all: [],
};

export const Default: Story = {
  args: {
    emotions: mockEmotions,
  },
  parameters: {
    docs: {
      description: {
        story: '기본 감정 목록 - 최근 사용한 탭이 기본으로 선택됨',
      },
    },
  },
};

export const RecentTab: Story = {
  args: {
    emotions: mockEmotions,
  },
  parameters: {
    docs: {
      description: {
        story: '최근 사용한 감정 탭 - 시간순으로 정렬된 감정 표시',
      },
    },
  },
};

export const FrequentTab: Story = {
  args: {
    emotions: mockEmotions,
    defaultTab: 'frequent',
  },
  parameters: {
    docs: {
      description: {
        story: '자주 사용한 감정 탭 - 사용 횟수가 많은 감정 표시',
      },
    },
  },
};

export const FewEmotions: Story = {
  args: {
    emotions: fewEmotions,
  },
  parameters: {
    docs: {
      description: {
        story: '감정이 적은 경우 - 각 탭에 2개씩만 표시',
      },
    },
  },
};

export const EmptyEmotions: Story = {
  args: {
    emotions: emptyEmotions,
  },
  parameters: {
    docs: {
      description: {
        story: '감정이 없는 경우 - 빈 목록 표시',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    emotions: mockEmotions,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드 - 어두운 배경의 감정 목록',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="min-h-screen bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Interactive: Story = {
  args: {
    emotions: mockEmotions,
  },
  parameters: {
    docs: {
      description: {
        story: `
감정 목록 컴포넌트 기능:

**탭 전환**
- 최근 사용한: 시간순으로 정렬된 감정
- 자주 사용한: 사용 횟수가 많은 순서로 정렬

**감정 아이템**
- 이모지와 감정명 표시
- 우측에 사용 횟수 표시
- 클릭 시 해당 감정으로 검색 페이지 이동
- Active 상태: 회색 배경 표시

**스크롤**
- 긴 목록은 스크롤 가능
- 스크롤바 숨김 처리
        `,
      },
    },
  },
};
