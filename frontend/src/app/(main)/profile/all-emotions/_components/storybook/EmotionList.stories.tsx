import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import EmotionList from '../EmotionList';
import { Emotion } from '@/lib/types/profile';

// EmotionList props:
//   emotions: Emotion[]  →  { emotion: string; count: number }[]
//   defaultTab?: 'recent' | 'frequent'
//
// 이모지는 EMOTION_MAP에서 컴포넌트가 직접 조회하므로 mock에 포함하지 않는다.
// 최근 사용 탭은 전달받은 순서 그대로, 자주 사용 탭은 count 내림차순으로 내부 정렬된다.

// 최근 사용 순 (시간순 — count 순 아님)
const mockRecent: Emotion[] = [
  { emotion: '재미', count: 3 },
  { emotion: '행복', count: 18 },
  { emotion: '피곤', count: 4 },
  { emotion: '만족', count: 10 },
  { emotion: '보통', count: 8 },
  { emotion: '좋음', count: 12 },
  { emotion: '감동', count: 6 },
  { emotion: '슬픔', count: 2 },
];

const fewEmotions: Emotion[] = [
  { emotion: '행복', count: 3 },
  { emotion: '보통', count: 2 },
];

const meta = {
  title: 'Profile/AllEmotions/EmotionList',
  component: EmotionList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '감정 전체 보기 페이지의 감정 목록 컴포넌트입니다. 최근 사용한 / 자주 사용한 탭으로 전환하며, 자주 사용한 탭은 count 내림차순으로 자동 정렬됩니다. 감정 아이템 클릭 시 해당 감정으로 필터링된 검색 페이지(/search?emotions=…)로 이동합니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#121212] min-h-screen">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    emotions: { description: '감정 목록 (Emotion[]). 최근 사용 탭은 전달된 순서, 자주 사용 탭은 count 내림차순으로 표시됩니다.' },
    defaultTab: { control: 'inline-radio', options: ['recent', 'frequent'], description: '초기 선택 탭' },
  },
} satisfies Meta<typeof EmotionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { emotions: mockRecent },
  parameters: {
    docs: {
      description: {
        story: `
최근 사용 탭 기본 — 전달된 순서 그대로 표시됩니다.
- **탭 전환**: 자주 사용한 탭으로 전환하면 count 내림차순으로 재정렬됨
- **감정 클릭**: \`/search?emotions={감정명}\`으로 이동
        `,
      },
    },
  },
};

export const EmptyEmotions: Story = {
  args: { emotions: [] },
  parameters: {
    docs: {
      description: {
        story: '감정이 없는 경우 — "아직 기록한 감정이 없어요" 빈 상태 표시',
      },
    },
  },
};
