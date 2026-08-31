import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DailyDetailRecordItem from '../DailyDetailRecordItem';
import { Contributor, RecordPreview } from '@/lib/types/recordResponse';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

const mockRecord: RecordPreview = {
  postId: 'record-1',
  scope: 'ME',
  groupId: null,
  contributors: [],
  emotion: [],
  title: '성수동 카페 투어',
  eventAt: '2025-01-15T14:30:00Z',
  createdAt: '2025-01-15T15:00:00Z',
  updatedAt: '2025-01-15T15:00:00Z',
  location: {
    lat: 37.5445,
    lng: 127.0567,
    address: '서울 성동구 성수동2가',
    placeName: '어니언 성수',
  },
  tags: ['카페', '성수', '디저트'],
  rating: 4,
  blocks: [
    {
      id: 'time-1',
      type: 'TIME',
      value: { time: '14:30' },
      layout: { row: 0, col: 1, span: 1 },
    },
    {
      id: 'image-1',
      type: 'IMAGE',
      value: {
        tempUrls: [
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
        ],
      },
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
};

// 그룹 기록 참여자 (3명) — groupProfileImageId가 null이면 기본 프로필 이미지 표시
const mockContributors: Contributor[] = [
  { userId: 'user-1', role: 'AUTHOR', nickname: '김철수', groupNickname: '철수', groupProfileImageId: null, profileImageId: null },
  { userId: 'user-2', role: 'CONTRIBUTOR', nickname: '이영희', groupNickname: '영희', groupProfileImageId: null, profileImageId: null },
  { userId: 'user-3', role: 'CONTRIBUTOR', nickname: '박지민', groupNickname: '지민', groupProfileImageId: null, profileImageId: null },
];

// 참여자 6명 — 앞 4개 아바타 + +2 축약 표시 확인용
const mockManyContributors: Contributor[] = [
  ...mockContributors,
  { userId: 'user-4', role: 'CONTRIBUTOR', nickname: '최수진', groupNickname: '수진', groupProfileImageId: null, profileImageId: null },
  { userId: 'user-5', role: 'CONTRIBUTOR', nickname: '정민준', groupNickname: '민준', groupProfileImageId: null, profileImageId: null },
  { userId: 'user-6', role: 'CONTRIBUTOR', nickname: '한지수', groupNickname: '지수', groupProfileImageId: null, profileImageId: null },
];

const mockGroupRecord: RecordPreview = {
  ...mockRecord,
  postId: 'record-2',
  scope: 'GROUP',
  groupId: 'group-123',
  title: '팀 회식',
  contributors: mockContributors,
};

const mockGroupRecordManyMembers: RecordPreview = {
  ...mockGroupRecord,
  postId: 'record-3',
  contributors: mockManyContributors,
};

const meta = {
  title: 'Record/DailyDetailRecordItem',
  component: DailyDetailRecordItem,
  parameters: {
    layout: 'padded',
    docs: {
      story: { height: '450px' },
      description: {
        component:
          '일별 상세 페이지에서 기록 하나를 표시하는 카드 컴포넌트입니다. 블록 타입(IMAGE, TEXT, TAG, RATING, LOCATION 등)에 따라 카드 내용이 동적으로 구성됩니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <div className="relative pl-6">
            <div className="absolute -left-[7.5px] top-1 w-3.5 h-3.5 rounded-full z-10 border-2 shadow-sm dark:bg-white dark:border-[#121212] bg-itta-black border-white" />
            <Story />
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    record: {
      description: '기록 데이터 (RecordPreview). contributors 배열에 참여자가 있고 groupId prop이 전달될 때 아바타가 표시됩니다.',
    },
    groupId: {
      description: '그룹 ID. 전달 시 record.contributors 아바타와 그룹 상세 경로(/record/{id}?scope=group&groupId=…)로 이동합니다.',
    },
  },
} satisfies Meta<typeof DailyDetailRecordItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    record: mockRecord,
  },
  parameters: {
    docs: {
      description: {
        story: `
개인 기록 — 이미지, 텍스트, 태그, 평점 블록 포함
- **카드 클릭**: 기록 상세 페이지(\`/record/{id}\`)로 이동
- **블록 조건부 렌더링**: 블록 타입에 따라 카드 내용이 달라짐
        `,
      },
    },
  },
};

export const GroupRecordManyMembers: Story = {
  args: {
    record: mockGroupRecordManyMembers,
    groupId: 'group-123',
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 기록 — 참여자가 4명을 초과할 때 앞 4개 아바타 + +N으로 축약 표시됩니다.',
      },
    },
  },
};

