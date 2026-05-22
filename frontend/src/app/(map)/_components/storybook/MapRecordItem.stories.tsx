import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MapRecordItem } from '../MapRecordItem';
import { MapPostItem } from '@/lib/types/record';

const mockPost: MapPostItem = {
  id: 'post-1',
  lat: 37.5326,
  lng: 126.9905,
  title: '한강공원 피크닉',
  thumbnailMediaId: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  createdAt: '2026-01-15T14:30:00Z',
  tags: ['산책', '한강', '겨울'],
  placeName: '한강공원 여의도지구',
};

const mockPostNoThumbnail: MapPostItem = {
  id: 'post-2',
  lat: 37.5665,
  lng: 126.9780,
  title: '광화문 광장 방문',
  thumbnailMediaId: '',
  createdAt: '2026-01-10T11:00:00Z',
  tags: ['서울', '역사'],
  placeName: '광화문 광장',
};

const mockPostNoPlace: MapPostItem = {
  id: 'post-3',
  lat: 37.5444,
  lng: 127.0557,
  title: '성수동 카페 탐방',
  thumbnailMediaId: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
  createdAt: '2026-01-08T09:00:00Z',
  tags: ['카페', '성수동', '브런치', '주말'],
  placeName: null,
};

const meta = {
  title: 'Map/MapRecordItem',
  component: MapRecordItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
지도 페이지(\`/map\`) 하단 드로어의 기록 목록에서 각 기록 아이템을 표시하는 컴포넌트.

썸네일 이미지, 제목, 위치명, 날짜, 태그를 카드 형태로 표시한다.
지도 마커 클릭 시 해당 아이템이 하이라이트(isHighlighted=true) 상태로 강조된다.
우측 화살표 버튼 클릭 시 기록 상세 페이지로 이동한다.

- **isHighlighted**: 지도에서 선택된 마커와 연결된 기록인 경우 \`true\` — 초록색 테두리와 강조 스타일 적용
- **onSelect**: 카드 클릭 시 호출 — 지도에서 해당 마커 포커스
- **onNavigate**: 화살표 버튼 클릭 시 호출 — 기록 상세 페이지로 이동
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onSelect: () => {},
    onNavigate: () => {},
  },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-[#F9F9F9] dark:bg-[#121212] p-4 rounded-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapRecordItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    post: mockPost,
    isHighlighted: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
기본 상태의 기록 아이템 — 썸네일·위치·태그가 있는 일반적인 기록 카드.

- **카드 클릭**: \`onSelect\` 호출 → 지도에서 해당 마커 강조
- **화살표(→) 버튼 클릭**: \`onNavigate\` 호출 → 기록 상세 페이지 이동
- **isHighlighted 변경** (Controls 패널): true로 설정하면 초록색 하이라이트 스타일 적용
        `,
      },
    },
  },
};

export const Highlighted: Story = {
  args: {
    post: mockPost,
    isHighlighted: true,
  },
  parameters: {
    docs: {
      description: {
        story: '지도에서 해당 마커가 선택된 상태 — 초록색 테두리·배경·링 효과로 강조된다.',
      },
    },
  },
};

export const NoThumbnail: Story = {
  args: {
    post: mockPostNoThumbnail,
    isHighlighted: false,
  },
  parameters: {
    docs: {
      description: {
        story: '썸네일 이미지가 없는 기록 — 이미지 영역이 사라지고 텍스트 영역이 좌측으로 확장된다.',
      },
    },
  },
};

export const ItemList: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <MapRecordItem post={mockPost} isHighlighted={true} onSelect={args.onSelect} onNavigate={args.onNavigate} priorityLoad />
      <MapRecordItem post={mockPostNoThumbnail} isHighlighted={false} onSelect={args.onSelect} onNavigate={args.onNavigate} />
      <MapRecordItem post={mockPostNoPlace} isHighlighted={false} onSelect={args.onSelect} onNavigate={args.onNavigate} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '지도 드로어 목록 실제 렌더링 예시 — 첫 번째 아이템이 선택(하이라이트)된 상태.',
      },
    },
  },
};
