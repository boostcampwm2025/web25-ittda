import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RecordDetail from '../RecordDetail';
import {
  Block,
  RecordContributor,
  RecordDetailResponse,
} from '@/lib/types/record';
import { http, HttpResponse } from 'msw';
import { Suspense } from 'react';
import RecordDetailSkeleton from '../RecordDetailSkeleton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock 블록 데이터
const mockBlocks: Block[] = [
  {
    id: 'block-1',
    type: 'DATE',
    value: { date: '2025-01-15' },
    layout: { row: 1, col: 1, span: 1 },
  },
  {
    id: 'block-2',
    type: 'TIME',
    value: { time: '14:30' },
    layout: { row: 1, col: 2, span: 1 },
  },
  {
    id: 'block-3',
    type: 'TEXT',
    value: {
      text: '오늘 한강에서 산책을 했다. 날씨가 정말 좋았고, 겨울 햇살이 따뜻하게 내리쬐었다. 오랜만에 여유로운 시간을 보낼 수 있어서 행복했다.',
    },
    layout: { row: 2, col: 1, span: 2 },
  },
  {
    id: 'block-4',
    type: 'IMAGE',
    value: {
      // mediaIds를 넣으면 /api/media-image/:id 프록시를 우선 사용해 Storybook에서 이미지가 깨짐.
      // tempUrls만 두면 Unsplash URL을 직접 사용한다.
      tempUrls: [
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
      ],
    },
    layout: { row: 3, col: 1, span: 2 },
  },
  {
    id: 'block-5',
    type: 'LOCATION',
    value: {
      lat: 37.5326,
      lng: 126.9905,
      address: '서울특별시 영등포구 여의도동',
      placeName: '한강공원',
    },
    layout: { row: 4, col: 1, span: 2 },
  },
  {
    id: 'block-6',
    type: 'TAG',
    value: { tags: ['산책', '한강', '겨울', '힐링'] },
    layout: { row: 5, col: 1, span: 2 },
  },
  {
    id: 'block-7',
    type: 'MOOD',
    value: { mood: '행복' },
    layout: { row: 6, col: 1, span: 1 },
  },
  {
    id: 'block-8',
    type: 'RATING',
    value: { rating: 4 },
    layout: { row: 6, col: 2, span: 1 },
  },
];

const mockContributors: RecordContributor[] = [
  { userId: 'user-1', role: 'AUTHOR', nickname: '도비' },
];

const mockRecord: RecordDetailResponse = {
  id: 'record-1',
  scope: 'PERSONAL',
  ownerUserId: 'user-1',
  groupId: null,
  title: '한강 산책',
  createdAt: '2025-01-15T14:30:00Z',
  updatedAt: '2025-01-15T15:00:00Z',
  blocks: mockBlocks,
  contributors: mockContributors,
};

const mockGroupRecord: RecordDetailResponse = {
  ...mockRecord,
  id: 'record-2',
  scope: 'GROUP',
  groupId: 'group-1',
  contributors: [
    ...mockContributors,
    { userId: 'user-3', role: 'EDITOR', nickname: '루피' },
    { userId: 'user-2', role: 'EDITOR', nickname: '하니' },
  ],
};

const mockMinimalRecord: RecordDetailResponse = {
  ...mockRecord,
  id: 'record-3',
  blocks: [mockBlocks[0], mockBlocks[1], mockBlocks[2]],
  contributors: [mockContributors[0]],
};

const meta = {
  title: 'Record/RecordDetail',
  component: RecordDetail,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '기록 상세 페이지 컴포넌트입니다. 블록 기반 기록 본문(날짜, 시간, 텍스트, 이미지, 위치, 태그, 무드, 평점)과 작성자/기여자 섹션을 표시합니다.',
      },
    },
    nextjs: {
      appDirectory: true,
    },
    msw: {
      handlers: [
        http.get('/api/posts/:recordId', ({ params }) => {
          const { recordId } = params;
          let data = mockRecord;
          if (recordId === 'record-2') data = mockGroupRecord;
          if (recordId === 'record-3') data = mockMinimalRecord;
          return HttpResponse.json({ success: true, data });
        }),
        http.delete('/api/posts/:recordId', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#121212]">
          <div className="max-w-2xl mx-auto px-6 mt-6">
            <Suspense fallback={<RecordDetailSkeleton />}>
              <Story />
            </Suspense>
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof RecordDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    recordId: 'record-1',
  },
  parameters: {
    docs: {
      description: {
        story: `
내 기록함 상세 페이지 - 기본 뷰
- **블록 렌더링**: 블록 타입(DATE, TIME, TEXT, IMAGE, LOCATION, TAG, MOOD, RATING)에 따라 기록 본문이 동적으로 구성됨
- **이미지 블록**: 여러 이미지를 갤러리 형태로 표시
- **기여자 섹션**: 그룹 기록의 경우 기여자(EDITOR) 아바타 목록 표시

**헤더 우측 ⋯ 버튼 (Popover)**

작성자 본인 / 그룹 EDITOR 이상인 경우에만 표시됩니다. 버튼을 클릭하면 Popover가 열리며 아래 옵션이 나타납니다.

| 옵션 | 동작 |
|---|---|
| 공유하기 | 공유 링크가 이미 있으면 공유 드로어 오픈, 없으면 링크 생성 후 드로어 오픈 |
| 공유 링크 생성 / 해제 | 공유 토큰 유무에 따라 토글 — 링크 생성 또는 링크 해제 API 호출 |
| 수정하기 | 개인 기록: \`/add?mode=edit&postId={id}\` 이동 · 그룹 기록: 편집 세션 시작 후 편집 페이지 이동 |
| 삭제하기 | 삭제 확인 Drawer 오픈 → "삭제하기" 클릭 시 기록 삭제 후 이전 페이지로 이동 |
        `
      },
    },
  },
};

export const GroupRecord: Story = {
  args: {
    recordId: 'record-2',
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 기록함 상세 페이지 - 여러 기여자가 있는 경우',
      },
    },
  },
};

export const MinimalBlocks: Story = {
  args: {
    recordId: 'record-3',
  },
  parameters: {
    docs: {
      description: {
        story: '최소 블록만 있는 기록 (날짜, 시간, 텍스트)',
      },
    },
  },
};

