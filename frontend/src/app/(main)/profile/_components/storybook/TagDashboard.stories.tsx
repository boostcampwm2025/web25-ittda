import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TagDashboard from '../TagDashboard';
import { ProfileTag } from '@/lib/types/profile';
import { useEffect } from 'react';

const mockTags: ProfileTag = {
  recent: [
    { name: '아침', count: 1 },
    { name: '좋은글', count: 1 },
    { name: '점심', count: 1 },
    { name: '커피', count: 1 },
    { name: '식사', count: 1 },
  ],
  frequent: [
    { name: '산책', count: 12 },
    { name: '성수동', count: 8 },
    { name: '맛집', count: 7 },
    { name: '가족', count: 5 },
    { name: '주말', count: 4 },
  ],
  all: [
    { name: '산책', count: 12 },
    { name: '성수동', count: 8 },
    { name: '맛집', count: 7 },
    { name: '가족', count: 5 },
    { name: '아침', count: 1 },
    { name: '좋은글', count: 1 },
    { name: '점심', count: 1 },
    { name: '커피', count: 1 },
    { name: '식사', count: 1 },
    { name: '주말', count: 4 },
    { name: '독서', count: 3 },
    { name: '영화', count: 6 },
    { name: '데이트', count: 9 },
    { name: '운동', count: 2 },
    { name: '여행', count: 11 },
  ],
};

const emptyTags: ProfileTag = {
  recent: [],
  frequent: [],
  all: [],
};

const fewTags: ProfileTag = {
  recent: [
    { name: '산책', count: 3 },
    { name: '맛집', count: 2 },
  ],
  frequent: [
    { name: '산책', count: 3 },
    { name: '맛집', count: 2 },
  ],
  all: [
    { name: '산책', count: 3 },
    { name: '맛집', count: 2 },
  ],
};

const meta = {
  title: 'Profile/TagDashboard',
  component: TagDashboard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    tags: {
      description: '프로필 태그 데이터 (recent, frequent, all)',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TagDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: mockTags,
  },
  parameters: {
    docs: {
      description: {
        story: '기본 태그 대시보드 - 최근 사용 / 자주 사용 탭 전환 가능',
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
        story: '최근 사용 태그 탭 (기본 선택)',
      },
    },
  },
};

// 자주 사용 탭이 자동으로 클릭되도록 래퍼 컴포넌트 생성
function TagDashboardWithFrequentTab({ tags }: { tags: ProfileTag }) {
  useEffect(() => {
    // DOM이 렌더링된 후 자주 사용 버튼 클릭
    const timer = setTimeout(() => {
      const buttons = document.querySelectorAll('button');
      const frequentButton = Array.from(buttons).find(
        (button) => button.textContent === '자주 사용',
      );
      if (frequentButton) {
        (frequentButton as HTMLButtonElement).click();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return <TagDashboard tags={tags} />;
}

export const FrequentTab: Story = {
  args: {
    tags: mockTags,
  },
  parameters: {
    docs: {
      description: {
        story:
          '자주 사용 태그 탭 - 사용 횟수가 많은 순으로 정렬. Docs 모드에서도 자동으로 탭이 전환됩니다.',
      },
    },
  },
  render: (args) => <TagDashboardWithFrequentTab {...args} />,
};

export const EmptyTags: Story = {
  args: {
    tags: emptyTags,
  },
  parameters: {
    docs: {
      description: {
        story: '태그가 없는 경우 - "사용된 태그가 없습니다" 메시지 표시',
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
        story: '태그가 적은 경우 (2개)',
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
        story: '다크 모드 태그 대시보드',
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

export const WithComboSearch: Story = {
  args: {
    tags: mockTags,
  },
  parameters: {
    docs: {
      description: {
        story: `
태그 대시보드 기능:
- **탭 전환**: 최근 사용 / 자주 사용 태그 전환
- **조합 검색**: Drawer로 여러 태그 선택 후 검색
- **모두 보기**: /profile/all-tags 페이지로 이동
- **태그 표시**: 최대 5개까지 표시, 각 태그의 사용 횟수 표시
        `,
      },
    },
  },
};
