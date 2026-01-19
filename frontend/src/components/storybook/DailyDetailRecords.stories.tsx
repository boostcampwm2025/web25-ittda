import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DailyDetailRecords from '../DailyDetailRecords';
import { RecordPreview } from '@/lib/types/recordResponse';
import { ActiveMember } from '@/lib/types/group';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const mockMemories: RecordPreview[] = [
  {
    postId: 'record-1',
    scope: 'ME',
    groupId: null,
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
  },
  {
    postId: 'record-2',
    scope: 'ME',
    groupId: null,
    title: '점심 브런치',
    eventAt: '2025-01-15T11:00:00Z',
    createdAt: '2025-01-15T12:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z',
    location: {
      lat: 37.5347,
      lng: 127.0008,
      address: '서울 용산구 한남동',
      placeName: '브런치 카페',
    },
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
    title: '아침 조깅',
    eventAt: '2025-01-15T07:00:00Z',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
    location: {
      lat: 37.5171,
      lng: 127.0416,
      address: '서울 송파구 잠실동',
      placeName: '한강공원',
    },
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
        value: {
          lat: 37.5171,
          lng: 127.0416,
          address: '서울 송파구 잠실동',
          placeName: '한강공원',
        },
        layout: { row: 2, col: 1, span: 2 },
      },
    ],
  },
];

const mockGroupMemories: RecordPreview[] = [
  {
    ...mockMemories[0],
    scope: 'GROUP',
    groupId: 'group-123',
  },
  {
    ...mockMemories[1],
    scope: 'GROUP',
    groupId: 'group-123',
  },
];

const mockMembers: ActiveMember[] = [
  {
    id: 1,
    name: '김철수',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    role: 'admin',
    recordId: 'record-1',
  },
  {
    id: 2,
    name: '이영희',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
    role: 'member',
    recordId: 'record-2',
  },
];

const meta = {
  title: 'Record/DailyDetailRecords',
  component: DailyDetailRecords,
  parameters: {
    layout: 'padded',
    docs: {
      story: { inline: false, height: '700px' },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    memories: {
      description: '기록 목록 (RecordPreview[])',
    },
    members: {
      description: '그룹 멤버 목록 (그룹 기록일 때만)',
    },
  },
} satisfies Meta<typeof DailyDetailRecords>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 개인 기록
export const Default: Story = {
  args: {
    memories: mockMemories,
  },
  parameters: {
    docs: {
      description: {
        story: '개인 일별 상세 - 타임라인 형태의 기록 목록',
      },
    },
  },
};

// 그룹 기록
export const GroupRecords: Story = {
  args: {
    memories: mockGroupMemories,
    members: mockMembers,
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 일별 상세 - 멤버 정보와 함께 표시',
      },
    },
  },
};

// 기록이 하나인 경우
export const SingleRecord: Story = {
  args: {
    memories: [mockMemories[0]],
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 하나만 있는 경우',
      },
    },
  },
};

// 기록이 많은 경우
export const ManyRecords: Story = {
  args: {
    memories: [...mockMemories, ...mockMemories],
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 많은 경우 - 스크롤 확인',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    memories: mockMemories,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <div className="dark">
          <div className="max-w-md mx-auto p-5 bg-[#121212]">
            <Story />
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
};
