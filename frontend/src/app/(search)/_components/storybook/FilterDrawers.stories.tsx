import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FilterChip } from '@/components/search/FilterChip';
import EmotionDrawer from '@/app/(post)/_components/editor/emotion/EmotionDrawer';
import DateDrawer from '@/components/DateDrawer';
import TagSearchDrawer from '../TagSearchDrawer';

import { createMockTagStats } from '@/lib/mocks/mock';

const mockTagsQueryHandler = http.get('/api/stats/tags', () =>
  HttpResponse.json({ success: true, data: createMockTagStats() }),
);

function makeTagClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['profile', 'tags', 'summary', 10], createMockTagStats());
  return client;
}

const tagClient = makeTagClient();

type ActiveDrawer = 'tag' | 'emotion' | 'date' | null;

// ─── 필터 바 전체 흐름 래퍼 ──────────────────────────────────────────────────
function SearchFilterBar({
  initialTags = [],
  initialEmotions = [],
  initialDateRange = { start: null, end: null },
}: {
  initialTags?: string[];
  initialEmotions?: string[];
  initialDateRange?: { start: string | null; end: string | null };
}) {
  const [tags, setTags] = useState(initialTags);
  const [emotions, setEmotions] = useState(initialEmotions);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);

  const tagLabel = tags.length > 0 ? tags.map((t) => `#${t}`).join(', ') : '태그';
  const emotionLabel = emotions.length > 0 ? emotions.join(', ') : '감정';
  const dateLabel =
    dateRange.start
      ? dateRange.end
        ? `${dateRange.start} ~ ${dateRange.end}`
        : dateRange.start
      : '날짜';

  return (
    <QueryClientProvider client={tagClient}>
      <div className="w-full max-w-lg p-4 bg-[#F9F9F9] dark:bg-[#121212] rounded-2xl flex flex-col gap-4">
        {/* 필터 칩 바 */}
        <div className="flex gap-2 flex-wrap">
          <FilterChip
            type="tag"
            label={tagLabel}
            isActive={tags.length > 0}
            onClick={() => setActiveDrawer('tag')}
            onClear={() => setTags([])}
          />
          <FilterChip
            type="emotion"
            label={emotionLabel}
            isActive={emotions.length > 0}
            onClick={() => setActiveDrawer('emotion')}
            onClear={() => setEmotions([])}
          />
          <FilterChip
            type="date"
            label={dateLabel}
            isActive={!!dateRange.start}
            onClick={() => setActiveDrawer('date')}
            onClear={() => setDateRange({ start: null, end: null })}
          />
        </div>

        {/* 선택된 값 표시 */}
        <div className="text-[11px] text-gray-400 space-y-0.5">
          <p>태그: {tags.length > 0 ? tags.join(', ') : '없음'}</p>
          <p>감정: {emotions.length > 0 ? emotions.join(', ') : '없음'}</p>
          <p>날짜: {dateRange.start ?? '없음'}{dateRange.end ? ` ~ ${dateRange.end}` : ''}</p>
        </div>
      </div>

      {/* 드로어들 */}
      {activeDrawer === 'tag' && (
        <TagSearchDrawer
          selectedTags={tags}
          onToggleTag={(tag) =>
            setTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
            )
          }
          onReset={() => setTags([])}
          onClose={() => setActiveDrawer(null)}
        />
      )}

      <EmotionDrawer
        isOpen={activeDrawer === 'emotion'}
        selectedEmotion={emotions}
        onSelect={(e) =>
          setEmotions((prev) =>
            prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
          )
        }
        onReset={() => setEmotions([])}
        onClose={() => setActiveDrawer(null)}
        mode="search"
      />

      {activeDrawer === 'date' && (
        <DateDrawer
          mode="range"
          currentRange={dateRange}
          onSelectRange={(r) => {
            setDateRange(r);
            setActiveDrawer(null);
          }}
          onClose={() => setActiveDrawer(null)}
        />
      )}
    </QueryClientProvider>
  );
}

// ─── Meta ────────────────────────────────────────────────────────────────────
const meta = {
  title: 'Search/FilterDrawers',
  component: SearchFilterBar,
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
    msw: { handlers: [mockTagsQueryHandler] },
    docs: {
      description: {
        component: `
검색 페이지의 필터 칩(\`FilterChip\`)을 클릭하면 열리는 드로어 모음.

각 칩 클릭 → 드로어 열림 → 선택/확인 → 칩 활성화의 전체 흐름을 확인할 수 있다.

| 칩 타입 | 드로어 | 특이사항 |
|---------|--------|---------|
| 태그 | \`TagSearchDrawer\` | 다중 선택, 직접 입력 가능 |
| 감정 | \`EmotionDrawer\` (mode="search") | 다중 선택, 초기화 버튼 추가 |
| 날짜 | \`DateDrawer\` (mode="range") | 시작~종료 기간 선택 |
| 위치 | — | Google Maps — 스토리 제외 |
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
필터가 모두 비활성화된 초기 상태.

각 칩을 클릭하면 해당 드로어가 열리고, 선택 후 칩이 활성 상태(초록색)로 바뀐다.
활성 칩의 X 버튼을 클릭하면 해당 필터가 초기화된다.
        `,
      },
    },
  },
};

export const WithActiveFilters: Story = {
  args: {
    initialTags: ['성수동', '카페'],
    initialEmotions: ['행복', '재미'],
    initialDateRange: { start: '2026-01-01', end: '2026-01-31' },
  },
  parameters: {
    docs: {
      description: {
        story: '태그·감정·날짜 필터가 모두 적용된 상태 — 각 칩이 활성화되어 선택값이 표시된다.',
      },
    },
  },
};

export const EmotionFilterDrawer: Story = {
  name: 'EmotionDrawer (검색 모드)',
  render: () => {
    const [emotions, setEmotions] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8 bg-[#F9F9F9] dark:bg-[#121212] rounded-2xl flex flex-col items-center gap-4">
        <FilterChip
          type="emotion"
          label={emotions.length > 0 ? emotions.join(', ') : '감정'}
          isActive={emotions.length > 0}
          onClick={() => setOpen(true)}
          onClear={() => setEmotions([])}
        />
        <EmotionDrawer
          isOpen={open}
          selectedEmotion={emotions}
          onSelect={(e) =>
            setEmotions((prev) =>
              prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
            )
          }
          onReset={() => setEmotions([])}
          onClose={() => setOpen(false)}
          mode="search"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
검색 필터용 감정 드로어 — 에디터의 단일 선택과 달리 **여러 감정을 동시에 선택**할 수 있다.

- **감정 클릭**: 토글 선택 (여러 개 선택 가능)
- **초기화 버튼**: 선택된 감정 전체 해제
- **확인 버튼**: 드로어 닫기
        `,
      },
    },
  },
};

export const DateRangeFilterDrawer: Story = {
  name: 'DateDrawer (기간 선택 모드)',
  render: () => {
    const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
      start: null,
      end: null,
    });
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8 bg-[#F9F9F9] dark:bg-[#121212] rounded-2xl flex flex-col items-center gap-4">
        <FilterChip
          type="date"
          label={
            dateRange.start
              ? dateRange.end
                ? `${dateRange.start} ~ ${dateRange.end}`
                : dateRange.start
              : '날짜'
          }
          isActive={!!dateRange.start}
          onClick={() => setOpen(true)}
          onClear={() => setDateRange({ start: null, end: null })}
        />
        {open && (
          <DateDrawer
            mode="range"
            currentRange={dateRange}
            onSelectRange={(r) => { setDateRange(r); setOpen(false); }}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
검색 필터용 날짜 기간 드로어 — 시작일과 종료일을 선택해 기간 필터를 설정한다.

- **날짜 클릭**: 첫 번째 클릭은 시작일, 두 번째는 종료일 설정
- **← / → 버튼**: 월 이동
- **↺ 버튼**: 기간 초기화
- **완료 버튼**: 드로어 닫기
        `,
      },
    },
  },
};
