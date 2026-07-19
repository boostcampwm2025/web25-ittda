import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import TagSearchDrawer from '../TagSearchDrawer';
import { createMockTagStats } from '@/lib/mocks/mock';

function makeClient(tags?: ReturnType<typeof createMockTagStats>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  if (tags) {
    client.setQueryData(['profile', 'tags', 'summary', 10], tags);
  }
  return client;
}

const clients = {
  withTags: makeClient(createMockTagStats()),
  noTags: makeClient({ recentTags: [], frequentTags: [] }),
  withSelected: makeClient(createMockTagStats()),
};

function TagSearchDrawerWrapper({
  initialTags = [],
  hasTags = true,
}: {
  initialTags?: string[];
  hasTags?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const client = hasTags ? (initialTags.length ? clients.withSelected : clients.withTags) : clients.noTags;

  if (!open) {
    return (
      <div className="p-6 bg-[#F9F9F9] dark:bg-[#121212] rounded-xl flex flex-col items-center gap-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {selectedTags.length > 0
            ? `선택된 태그: ${selectedTags.map((t) => `#${t}`).join(', ')}`
            : '선택된 태그 없음'}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-itta-point text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
        >
          태그 검색 드로어 열기
        </button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <TagSearchDrawer
        selectedTags={selectedTags}
        onToggleTag={(tag) =>
          setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
          )
        }
        onReset={() => setSelectedTags([])}
        onClose={() => setOpen(false)}
      />
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Search/TagSearchDrawer',
  component: TagSearchDrawerWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
검색 페이지의 태그 필터 칩을 클릭하면 열리는 드로어 컴포넌트.

직접 태그를 입력하거나 자주 사용한 태그 목록에서 클릭해 여러 태그를 선택할 수 있다.
Enter 키 또는 + 버튼으로 입력한 태그를 추가하고, 선택된 태그는 상단에 배지로 표시된다.

- **onToggleTag**: 태그 선택/해제 시 호출
- **onReset**: 초기화 버튼 클릭 시 전체 선택 해제
- **onClose**: 완료 또는 드로어 닫기 시 호출
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TagSearchDrawerWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initialTags: [], hasTags: true },
  parameters: {
    docs: {
      description: {
        story: `
태그가 선택되지 않은 초기 상태.

- **"태그 검색 드로어 열기" 버튼** 클릭 시 드로어 표시
- **태그 입력 후 Enter 또는 + 버튼**: 태그 추가
- **자주 사용한 태그 클릭**: 태그 선택/해제 토글
- **초기화 버튼**: 선택된 태그 전체 해제
- **완료 버튼**: 드로어 닫기
        `,
      },
    },
  },
};

export const NoFrequentTags: Story = {
  args: { initialTags: [], hasTags: false },
  parameters: {
    docs: {
      description: {
        story: '자주 사용한 태그가 없는 경우 — "아직 사용한 태그가 없어요" 안내 메시지가 표시된다.',
      },
    },
  },
};
