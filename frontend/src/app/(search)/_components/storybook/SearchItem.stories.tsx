import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SearchItem from '../SearchItem';
import { RecordSearchItem } from '@/lib/types/record';

const mockRecord: RecordSearchItem = {
  id: 'record-1',
  title: '성수동 카페 투어',
  address: '서울 성동구 성수동2가',
  date: '2026-01-15T10:00:00Z',
  content:
    '오늘 성수동에서 카페를 여러 곳 방문했다. 분위기도 좋고 커피도 맛있었다.',
  previewMediaIds: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
  ],
  snippet: '오늘 성수동에서 카페를 여러 곳 방문했다.',
};

const mockRecordMultipleImages: RecordSearchItem = {
  id: 'record-4',
  title: '을지로 골목 탐방',
  address: '서울 중구 을지로3가',
  date: '2026-01-12T13:00:00Z',
  content: '을지로 골목골목을 돌아다니며 사진을 많이 찍었다.',
  previewMediaIds: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&q=80&w=400',
  ],
  snippet: '을지로 골목골목을 돌아다니며 사진을 많이 찍었다.',
};

const mockRecordNoThumbnail: RecordSearchItem = {
  id: 'record-2',
  title: '한강 산책',
  address: '서울 영등포구 여의도동',
  date: '2026-01-10T14:00:00Z',
  content: '오랜만에 한강에서 산책을 했다. 날씨가 맑고 상쾌했다.',
  previewMediaIds: [],
  snippet: '오랜만에 한강에서 산책을 했다.',
};

const mockRecordMinimal: RecordSearchItem = {
  id: 'record-3',
  title: '짧은 메모',
  address: '',
  date: '2026-01-05T08:00:00Z',
  content: '간단한 메모만 남긴 기록.',
  previewMediaIds: [],
};

const noop = () => {};

const meta = {
  title: 'Search/SearchItem',
  component: SearchItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
검색 페이지(\`/search\`)에서 검색 결과 목록의 각 기록 아이템을 표시하는 컴포넌트.

썸네일 이미지(있는 경우), 제목, 스니펫, 날짜, 위치 정보를 카드 형태로 표시한다.
클릭 시 \`onClick(id)\`가 호출되어 기록 상세 페이지로 이동한다.

- **previewMediaIds**: 1장이면 정사각형 썸네일, 여러 장이면 가로 스크롤 스트립, 없으면 이미지 영역 생략
- **snippet**: 검색 키워드가 포함된 본문 발췌문
- **address**: 위치 정보가 없으면 위치 영역 숨김
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: { onClick: noop },
  decorators: [
    (Story) => (
      <div className="max-w-xl bg-[#F9F9F9] dark:bg-[#121212] p-4 rounded-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { record: mockRecord },
  parameters: {
    docs: {
      description: {
        story: `
썸네일·스니펫·주소가 모두 있는 기본 검색 결과 아이템.

- **카드 클릭**: \`onClick(record.id)\` 호출 → 기록 상세 페이지(\`/record/:id\`)로 이동
- **priorityLoad**: 첫 번째 결과에 true를 설정해 이미지 우선 로드 가능
        `,
      },
    },
  },
};

export const MultipleImages: Story = {
  args: { record: mockRecordMultipleImages },
  parameters: {
    docs: {
      description: {
        story:
          '이미지가 여러 장인 경우 — 지도 페이지와 동일하게 가로 스크롤 썸네일 스트립으로 표시된다.',
      },
    },
  },
};

export const NoThumbnail: Story = {
  args: { record: mockRecordNoThumbnail },
  parameters: {
    docs: {
      description: {
        story:
          '썸네일 이미지가 없는 경우 — 이미지 자리에 이미지 아이콘이 표시된다.',
      },
    },
  },
};

export const Minimal: Story = {
  args: { record: mockRecordMinimal },
  parameters: {
    docs: {
      description: {
        story:
          '스니펫·주소가 없는 최소 구성의 기록 아이템 — 제목과 날짜만 표시된다.',
      },
    },
  },
};

export const ResultList: Story = {
  args: { record: mockRecord },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <SearchItem record={mockRecord} onClick={args.onClick} priorityLoad />
      <SearchItem record={mockRecordMultipleImages} onClick={args.onClick} />
      <SearchItem record={mockRecordNoThumbnail} onClick={args.onClick} />
      <SearchItem record={mockRecordMinimal} onClick={args.onClick} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '실제 검색 결과 목록처럼 여러 아이템이 나열된 상태.',
      },
    },
  },
};
