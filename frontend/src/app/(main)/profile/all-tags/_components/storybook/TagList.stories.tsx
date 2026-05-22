import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TagList from '../TagList';
import { TagStatSummary } from '@/lib/types/profile';

// TagList props:
//   tags: TagStatSummary  →  { recentTags: Tag[], frequentTags: Tag[] }
//   defaultTab?: 'recentTags' | 'frequentTags'
// Tag 타입: { tag: string; count: number }

// 최근 사용 순 (시간순 — count 순 아님)
const mockTags: TagStatSummary = {
  recentTags: [
    { tag: '카페', count: 3 },
    { tag: '여행', count: 15 },
    { tag: '운동', count: 7 },
    { tag: '맛집', count: 12 },
    { tag: '독서', count: 5 },
    { tag: '친구', count: 8 },
    { tag: '영화', count: 4 },
    { tag: '공부', count: 3 },
  ],
  frequentTags: [
    { tag: '여행', count: 15 },
    { tag: '맛집', count: 12 },
    { tag: '친구', count: 8 },
    { tag: '운동', count: 7 },
    { tag: '독서', count: 5 },
    { tag: '영화', count: 4 },
    { tag: '카페', count: 3 },
    { tag: '공부', count: 3 },
  ],
};

const fewTags: TagStatSummary = {
  recentTags: [
    { tag: '카페', count: 2 },
    { tag: '여행', count: 5 },
  ],
  frequentTags: [
    { tag: '여행', count: 5 },
    { tag: '카페', count: 2 },
  ],
};

const emptyTags: TagStatSummary = {
  recentTags: [],
  frequentTags: [],
};

const meta = {
  title: 'Profile/AllTags/TagList',
  component: TagList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '태그 전체 보기 페이지의 태그 목록 컴포넌트입니다. 최근 사용한 / 자주 사용한 탭으로 전환하며, 각 탭에서 해당 목록을 표시합니다. 태그 아이템 클릭 시 해당 태그로 필터링된 검색 페이지(/search?tags=…)로 이동합니다.',
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
    tags: { description: '태그 목록 (TagStatSummary). recentTags: 최근 사용 순, frequentTags: count 내림차순.' },
    defaultTab: { control: 'inline-radio', options: ['recentTags', 'frequentTags'], description: '초기 선택 탭' },
  },
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { tags: mockTags },
  parameters: {
    docs: {
      description: {
        story: `
최근 사용 탭 기본 — 시간 역순으로 표시됩니다.
- **탭 전환**: 자주 사용한 탭으로 전환하면 count 내림차순 목록으로 전환
- **태그 클릭**: \`/search?tags={태그명}\`으로 이동
        `,
      },
    },
  },
};

export const EmptyTags: Story = {
  args: { tags: emptyTags },
  parameters: {
    docs: {
      description: {
        story: '태그가 없는 경우 — "아직 사용한 태그가 없어요" 빈 상태 표시',
      },
    },
  },
};
