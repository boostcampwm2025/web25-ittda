import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DailyDetailRecordItem from '../DailyDetailRecordItem';
import { RecordPreview } from '@/lib/types/recordResponse';
import { Member } from '@/lib/types/group';

const createQueryClient = () =>
  new QueryClient({
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

const mockRecordWithLocation: RecordPreview = {
  ...mockRecord,
  postId: 'record-2',
  title: '한남동 브런치',
  blocks: [
    {
      id: 'time-2',
      type: 'TIME',
      value: { time: '11:00' },
      layout: { row: 0, col: 1, span: 1 },
    },
    {
      id: 'text-2',
      type: 'TEXT',
      value: { text: '에그 베네딕트가 정말 맛있었다!' },
      layout: { row: 1, col: 1, span: 2 },
    },
    {
      id: 'loc-2',
      type: 'LOCATION',
      value: {
        lat: 37.5347,
        lng: 127.0008,
        address: '서울 용산구 한남동',
        placeName: '카페 라떼',
      },
      layout: { row: 2, col: 1, span: 2 },
    },
    {
      id: 'rating-2',
      type: 'RATING',
      value: { rating: 5 },
      layout: { row: 3, col: 1, span: 2 },
    },
  ],
};

const mockGroupRecord: RecordPreview = {
  ...mockRecord,
  postId: 'record-3',
  scope: 'GROUP',
  groupId: 'group-123',
  title: '팀 회식',
};

const mockMembers: Member[] = [
  {
    id: 1,
    name: '김철수',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 2,
    name: '이영희',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 3,
    name: '박지민',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 4,
    name: '최수진',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
  },
];

const meta = {
  title: 'Record/DailyDetailRecordItem',
  component: DailyDetailRecordItem,
  parameters: {
    layout: 'padded',
    docs: {
      story: { inline: false, height: '450px' },
      description: {
        component:
          '일별 상세 기록 아이템 - 타임라인의 각 기록 카드를 표시합니다. 블록 레이아웃에 따라 동적으로 렌더링됩니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
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
      description: '기록 데이터 (RecordPreview)',
    },
    groupId: {
      description: '그룹 ID (그룹 기록일 때)',
    },
    members: {
      description: '그룹 멤버 목록 (그룹 기록일 때 아바타 표시)',
    },
  },
} satisfies Meta<typeof DailyDetailRecordItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 개인 기록
export const Default: Story = {
  args: {
    record: mockRecord,
  },
  parameters: {
    docs: {
      description: {
        story: '개인 기록 - 이미지, 텍스트, 태그, 평점 블록 포함',
      },
    },
  },
};

// 위치 정보가 있는 기록
export const WithLocation: Story = {
  args: {
    record: mockRecordWithLocation,
  },
  parameters: {
    docs: {
      description: {
        story: '위치 정보가 포함된 기록',
      },
    },
  },
};

// 그룹 기록 (멤버 아바타 표시)
export const GroupRecord: Story = {
  args: {
    record: mockGroupRecord,
    groupId: 'group-123',
    members: mockMembers,
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 기록 - 참여 멤버 아바타가 표시됩니다',
      },
    },
  },
};

// 그룹 기록 (멤버가 3명 이상)
export const GroupRecordManyMembers: Story = {
  args: {
    record: mockGroupRecord,
    groupId: 'group-123',
    members: mockMembers,
  },
  parameters: {
    docs: {
      description: {
        story: '그룹 기록 - 멤버가 3명 이상일 때 +N 표시',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    record: mockRecord,
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
            <div className="relative pl-6">
              <div className="absolute -left-[7.5px] top-1 w-3.5 h-3.5 rounded-full z-10 border-2 shadow-sm bg-white border-[#121212]" />
              <Story />
            </div>
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
};
