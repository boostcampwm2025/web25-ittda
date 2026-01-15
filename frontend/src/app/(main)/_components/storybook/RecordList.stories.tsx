import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RecordList from '../RecordList';
import { MemoryRecord } from '@/lib/types/record';
import { formatDateISO } from '@/lib/date';

const mockRecords: MemoryRecord[] = [
  {
    id: '1',
    title: '성수동 팝업 스토어 나들이',
    createdAt: Date.now(),
    customFields: [],
    fieldOrder: ['emotion', 'photos', 'location', 'content', 'rating', 'tags'],
    data: {
      date: formatDateISO().replace(/-/g, '.'),
      time: '오후 2:30',
      content:
        '드디어 가보고 싶었던 팝업 스토어 방문! 웨이팅은 길었지만 굿즈들이 너무 귀여웠다.',
      photos: ['/profile-ex.jpeg'],
      emotion: { emoji: '🤩', label: '설렘' },
      tags: ['데이트', '성수', '주말'],
      location: '성수동 카페거리',
      rating: { value: 4.5, max: 5 },
      media: null,
      table: null,
    },
  },
  {
    id: '2',
    title: '동지 팥죽 한 그릇',
    createdAt: Date.now(),
    customFields: [],
    fieldOrder: ['location', 'emotion', 'content', 'table', 'rating'],
    data: {
      date: formatDateISO().replace(/-/g, '.'),
      time: '오후 5:10',
      content: '어머니가 직접 쑤어주신 팥죽. 달지 않고 담백해서 좋다.',
      photos: [],
      emotion: { emoji: '🥣', label: '따뜻해' },
      tags: ['가족', '겨울'],
      location: '우리집',
      rating: { value: 5, max: 5 },
      media: null,
      table: [
        ['재료', '평가'],
        ['새알심', '쫀득함'],
        ['팥소', '진함'],
      ],
    },
  },
  {
    id: '3',
    title: '강남 카페 투어',
    createdAt: Date.now(),
    customFields: [],
    fieldOrder: ['photos', 'emotion', 'location', 'content', 'tags'],
    data: {
      date: formatDateISO().replace(/-/g, '.'),
      time: '오후 3:00',
      content: '강남 핫플 카페 3곳 돌아다니며 디저트 맛보기',
      photos: ['/profile-ex.jpeg', '/profile-ex.jpeg'],
      emotion: { emoji: '☕', label: '여유로움' },
      tags: ['카페', '강남', '디저트'],
      location: '강남역 일대',
      rating: { value: 4, max: 5 },
      media: null,
      table: null,
    },
  },
];

const meta = {
  title: 'Record/RecordList',
  component: RecordList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    records: {
      description: '표시할 기록 목록',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    records: mockRecords,
  },
};

export const SingleRecord: Story = {
  args: {
    records: [mockRecords[0]],
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 하나만 있는 경우',
      },
    },
  },
};

export const EmptyRecords: Story = {
  args: {
    records: [],
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 없는 경우 - "기록 추가하기" 버튼 표시',
      },
    },
  },
};

export const ManyRecords: Story = {
  args: {
    records: [...mockRecords, ...mockRecords, ...mockRecords],
  },
  parameters: {
    docs: {
      description: {
        story: '많은 기록이 있는 경우',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    records: mockRecords,
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
      <div className="dark">
        <div className="max-w-md mx-auto p-5 bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};
