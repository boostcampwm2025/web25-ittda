import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import RecordMapDrawer from '../RecordMapDrawer';
import { MapPostItem } from '@/lib/types/record';

const mockPosts: MapPostItem[] = [
  {
    id: 'post-1',
    lat: 37.5326,
    lng: 126.9905,
    title: '한강공원 피크닉',
    thumbnailMediaId: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-01-15T14:30:00Z',
    tags: ['산책', '한강', '겨울'],
    placeName: '한강공원 여의도지구',
  },
  {
    id: 'post-2',
    lat: 37.5665,
    lng: 126.9780,
    title: '광화문 광장 역사 탐방',
    thumbnailMediaId: '',
    createdAt: '2026-01-10T11:00:00Z',
    tags: ['서울', '역사', '문화'],
    placeName: '광화문 광장',
  },
  {
    id: 'post-3',
    lat: 37.5444,
    lng: 127.0557,
    title: '성수동 카페 투어',
    thumbnailMediaId: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-01-08T09:00:00Z',
    tags: ['카페', '성수동'],
    placeName: '성수동 카페거리',
  },
  {
    id: 'post-4',
    lat: 37.5172,
    lng: 127.0473,
    title: '강남 맛집 탐방',
    thumbnailMediaId: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-01-05T18:00:00Z',
    tags: ['맛집', '강남'],
    placeName: '강남역 근처',
  },
];

function RecordMapDrawerWrapper({
  posts,
  isLoading,
  initialSelectedId,
}: {
  posts: MapPostItem[];
  isLoading: boolean;
  initialSelectedId?: string | null;
}) {
  const [selectedPostId, setSelectedPostId] = useState<string | string[] | null>(
    initialSelectedId ?? null,
  );

  return (
    <div className="relative h-[500px] bg-gray-200 dark:bg-gray-700 rounded-t-2xl overflow-hidden">
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        지도 영역 (Storybook에서 Google Maps 미표시)
      </div>
      <RecordMapDrawer
        posts={posts}
        selectedPostId={selectedPostId}
        onSelectPost={setSelectedPostId}
        isLoading={isLoading}
      />
    </div>
  );
}

const meta = {
  title: 'Map/RecordMapDrawer',
  component: RecordMapDrawerWrapper,
  parameters: {
    layout: 'padded',
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component: `
지도 페이지(\`/map\`) 하단에 고정된 바텀 시트 드로어 컴포넌트.

지도 주변의 기록 목록을 스크롤 가능한 카드 목록으로 표시하며, 상단 핸들 드래그로 높이를 조절할 수 있다.
지도 마커를 클릭하면 해당 기록이 하이라이트되고 드로어가 반쯤 올라온다.
지도 빈 영역 클릭 시 선택이 해제되고 드로어가 닫힌다.

- **selectedPostId**: 현재 선택된 기록 ID — 해당 카드를 자동 스크롤 후 하이라이트
- **isLoading**: 데이터 로딩 중일 때 스피너 표시
- **posts**: 표시할 기록 목록; 빈 배열이면 "주변에 기록이 없어요" 안내
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecordMapDrawerWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    posts: mockPosts,
    isLoading: false,
    initialSelectedId: null,
  },
  parameters: {
    docs: {
      description: {
        story: `
기록 4개가 있는 기본 상태 — 드로어가 최소 높이로 시작한다.

- **상단 핸들 드래그**: 드로어 높이 조절 (축소/반절/전체)
- **카드 클릭**: 해당 기록 선택 → 드로어 반절 높이로 팝업
- **배경 클릭**: 선택 해제 → 드로어 축소
- **화살표(→) 버튼**: 기록 상세 페이지로 이동
        `,
      },
    },
  },
};

export const WithSelectedPost: Story = {
  args: {
    posts: mockPosts,
    isLoading: false,
    initialSelectedId: 'post-1',
  },
  parameters: {
    docs: {
      description: {
        story: '첫 번째 기록이 선택된 상태로 시작 — 해당 카드가 초록색으로 하이라이트되고 드로어가 반절 높이로 열린다.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    posts: [],
    isLoading: true,
    initialSelectedId: null,
  },
  parameters: {
    docs: {
      description: {
        story: '기록 데이터를 로딩 중인 상태 — 스피너가 표시된다.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    posts: [],
    isLoading: false,
    initialSelectedId: null,
  },
  parameters: {
    docs: {
      description: {
        story: '현재 지도 영역에 기록이 없는 상태 — "주변에 기록이 없어요" 안내 메시지와 아이콘이 표시된다.',
      },
    },
  },
};
