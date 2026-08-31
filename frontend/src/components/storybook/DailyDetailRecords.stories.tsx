import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DailyDetailRecords from '../DailyDetailRecords';
import { Contributor, RecordPreview } from '@/lib/types/recordResponse';

// DailyDetailRecords는 내부에서 useSuspenseQuery(recordPreviewListOptions)로 데이터를 가져온다.
// setQueryData의 키는 recordPreviewListOptions의 queryKey와 정확히 일치해야 한다.
//   - personal: ['my', 'records', 'preview', date, 'personal']
//   - groups:   ['group', groupId, 'records', 'daily', date]

const DATE = '2025-01-15';
const GROUP_ID = 'group-123';

const mockContributors: Contributor[] = [
  { userId: 'user-1', role: 'AUTHOR', nickname: '김철수', groupNickname: '철수', groupProfileImageId: null, profileImageId: null },
  { userId: 'user-2', role: 'CONTRIBUTOR', nickname: '이영희', groupNickname: '영희', groupProfileImageId: null, profileImageId: null },
];

const mockRecords: RecordPreview[] = [
  {
    postId: 'record-1',
    scope: 'ME',
    groupId: null,
    contributors: [],
    emotion: [],
    title: '성수동 카페 투어',
    eventAt: '2025-01-15T14:30:00Z',
    createdAt: '2025-01-15T15:00:00Z',
    updatedAt: '2025-01-15T15:00:00Z',
    location: { lat: 37.5445, lng: 127.0567, address: '서울 성동구 성수동2가', placeName: '어니언 성수' },
    tags: ['카페', '성수', '디저트'],
    rating: 4,
    blocks: [
      {
        id: 'image-1',
        type: 'IMAGE',
        value: { tempUrls: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400'] },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'text-1',
        type: 'TEXT',
        value: { text: '오늘 성수동에서 발견한 숨은 카페! 분위기가 너무 좋았다.' },
        layout: { row: 2, col: 1, span: 2 },
      },
      {
        id: 'tag-1',
        type: 'TAG',
        value: { tags: ['카페', '성수', '디저트'] },
        layout: { row: 3, col: 1, span: 1 },
      },
      {
        id: 'rating-1',
        type: 'RATING',
        value: { rating: 4 },
        layout: { row: 3, col: 2, span: 1 },
      },
    ],
  },
  {
    postId: 'record-2',
    scope: 'ME',
    groupId: null,
    contributors: [],
    emotion: [],
    title: '점심 브런치',
    eventAt: '2025-01-15T11:00:00Z',
    createdAt: '2025-01-15T12:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z',
    location: { lat: 37.5347, lng: 127.0008, address: '서울 용산구 한남동', placeName: '브런치 카페' },
    tags: ['브런치', '한남동'],
    rating: 5,
    blocks: [
      {
        id: 'text-2',
        type: 'TEXT',
        value: { text: '에그 베네딕트가 정말 맛있었다!' },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'rating-2',
        type: 'RATING',
        value: { rating: 5 },
        layout: { row: 2, col: 1, span: 2 },
      },
    ],
  },
  {
    postId: 'record-3',
    scope: 'ME',
    groupId: null,
    contributors: [],
    emotion: [],
    title: '아침 조깅',
    eventAt: '2025-01-15T07:00:00Z',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
    location: { lat: 37.5171, lng: 127.0416, address: '서울 송파구 잠실동', placeName: '한강공원' },
    tags: ['운동', '조깅'],
    rating: null,
    blocks: [
      {
        id: 'text-3',
        type: 'TEXT',
        value: { text: '상쾌한 아침 운동으로 하루 시작!' },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'loc-3',
        type: 'LOCATION',
        value: { lat: 37.5171, lng: 127.0416, address: '서울 송파구 잠실동', placeName: '한강공원' },
        layout: { row: 2, col: 1, span: 2 },
      },
    ],
  },
];

const mockGroupRecords: RecordPreview[] = mockRecords.map((r, i) => ({
  ...r,
  scope: 'GROUP',
  groupId: GROUP_ID,
  contributors: i === 0 ? mockContributors : [mockContributors[0]],
}));

function makeClient(queryKey: unknown[], data: RecordPreview[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(queryKey, data);
  return client;
}

const clients = {
  default: makeClient(['my', 'records', 'preview', DATE, 'personal'], mockRecords),
  group: makeClient(['group', GROUP_ID, 'records', 'daily', DATE], mockGroupRecords),
  single: makeClient(['my', 'records', 'preview', DATE, 'personal'], [mockRecords[0]]),
  empty: makeClient(['my', 'records', 'preview', DATE, 'personal'], []),
};

const meta = {
  title: 'Record/DailyDetailRecords',
  component: DailyDetailRecords,
  parameters: {
    layout: 'padded',
    docs: {
      story: { height: '700px' },
      description: {
        component:
          '일별 상세 페이지에서 해당 날짜의 기록 목록을 타임라인 형태로 표시하는 컴포넌트입니다. 내부에서 `recordPreviewListOptions`로 데이터를 직접 fetching하며, `scope="personal"` 또는 `scope="groups"` + `groupId`에 따라 개인/그룹 기록을 구분합니다. 기록이 없을 경우 빈 상태 UI를 표시합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    date: { description: '조회할 날짜 (YYYY-MM-DD 형식)', control: 'text' },
    scope: { description: '"personal" | "groups"', control: 'inline-radio', options: ['personal', 'groups'] },
    groupId: { description: '그룹 기록일 때 그룹 ID', control: 'text' },
  },
} satisfies Meta<typeof DailyDetailRecords>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { date: DATE, scope: 'personal' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
개인 일별 상세 — 타임라인 형태의 기록 목록
- **카드 클릭**: 기록 상세 페이지(\`/record/{id}\`)로 이동
- **타임라인 구조**: 세로 줄과 원형 마커로 시간순 기록 흐름을 시각화
        `,
      },
    },
  },
};

export const GroupRecords: Story = {
  args: { date: DATE, scope: 'groups', groupId: GROUP_ID },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.group}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 일별 상세 — 참여자 아바타가 각 카드에 표시됩니다.',
      },
    },
  },
};

export const EmptyRecords: Story = {
  args: { date: DATE, scope: 'personal' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.empty}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">로딩 중...</div>}>
            <Story />
          </Suspense>
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: { story: '기록이 없는 경우 — 빈 상태 UI 표시' },
    },
  },
};

