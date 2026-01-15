import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TagList from '../TagList';
import { ProfileTag } from '@/lib/types/profile';

const meta = {
  title: 'Profile/AllTags/TagList',
  component: TagList,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTags: ProfileTag = {
  recent: [
    { name: '여행', count: 15 },
    { name: '맛집', count: 12 },
    { name: '카페', count: 10 },
    { name: '친구', count: 8 },
    { name: '운동', count: 7 },
    { name: '독서', count: 5 },
    { name: '영화', count: 4 },
    { name: '공부', count: 3 },
  ],
  frequent: [
    { name: '일상', count: 45 },
    { name: '기록', count: 38 },
    { name: '추억', count: 32 },
    { name: '감사', count: 28 },
    { name: '성장', count: 25 },
    { name: '행복', count: 22 },
    { name: '도전', count: 18 },
    { name: '배움', count: 15 },
  ],
  all: [],
};

const fewTags: ProfileTag = {
  recent: [
    { name: '여행', count: 3 },
    { name: '맛집', count: 2 },
  ],
  frequent: [
    { name: '일상', count: 5 },
    { name: '기록', count: 4 },
  ],
  all: [],
};

const emptyTags: ProfileTag = {
  recent: [],
  frequent: [],
  all: [],
};

export const Default: Story = {
  args: {
    tags: mockTags,
  },
  parameters: {
    docs: {
      description: {
        story: '기본 태그 목록 - 최근 사용한 탭이 기본으로 선택됨',
      },
    },
  },
};

export const RecentTab: Story = {
  args: {
    tags: mockTags,
  },
  parameters: {
    docs: {
      description: {
        story: '최근 사용한 태그 탭 - 시간순으로 정렬된 태그 표시',
      },
    },
  },
};

export const FrequentTab: Story = {
  args: {
    tags: mockTags,
    defaultTab: 'frequent',
  },
  parameters: {
    docs: {
      description: {
        story: '자주 사용한 태그 탭 - 사용 횟수가 많은 태그 표시',
      },
    },
  },
};

export const FewTags: Story = {
  args: {
    tags: fewTags,
  },
  parameters: {
    docs: {
      description: {
        story: '태그가 적은 경우 - 각 탭에 2개씩만 표시',
      },
    },
  },
};

export const EmptyTags: Story = {
  args: {
    tags: emptyTags,
  },
  parameters: {
    docs: {
      description: {
        story: '태그가 없는 경우 - 빈 목록 표시',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    tags: mockTags,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드 - 어두운 배경의 태그 목록',
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
    tags: mockTags,
  },
  parameters: {
    docs: {
      description: {
        story: `
태그 목록 컴포넌트 기능:

**탭 전환**
- 최근 사용한: 시간순으로 정렬된 태그
- 자주 사용한: 사용 횟수가 많은 순서로 정렬

**태그 아이템**
- # 기호와 태그명 표시
- 우측에 사용 횟수 표시
- 클릭 시 해당 태그로 검색 페이지 이동
- Active 상태: 회색 배경 표시

**스크롤**
- 긴 목록은 스크롤 가능
- 스크롤바 숨김 처리
        `,
      },
    },
  },
};
