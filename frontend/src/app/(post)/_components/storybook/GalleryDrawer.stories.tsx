import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import GalleryDrawer from '../GalleryDrawer';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { ImageIcon, X } from 'lucide-react';

// AssetImage는 assetId가 https://로 시작하면 직접 URL로 사용한다.
// 실제 UUID를 쓰면 /api/media-image/:id 프록시를 거쳐 Storybook에서 이미지가 깨지므로
// mediaId 자리에 Unsplash URL을 넣어 직접 로드되도록 한다.
const PHOTO_URLS = [
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
];

function buildCoverPage(groupId: string) {
  return {
    groupId,
    sections: [
      {
        date: '2026-01-14',
        items: PHOTO_URLS.map((url, i) => ({
          mediaId: url,
          assetId: url,
          postId: `post-${i}`,
          postTitle: `기록 ${i + 1}`,
          eventAt: '2026-01-14T10:00:00Z',
          width: 400,
          height: 400,
          mimeType: 'image/jpeg',
        })),
      },
    ],
    pageInfo: { hasNext: false, nextCursor: null },
  };
}

/**
 * QueryClient에 infinite query 데이터를 직접 주입한다.
 *
 * GalleryDrawer는 내부에서 useInfiniteQuery + 인증 헤더가 필요한 fetch를 사용하므로
 * Storybook에서 MSW 핸들러로 인터셉트해도 auth 처리에서 실패할 수 있다.
 * setQueryData로 캐시를 미리 채우면 네트워크 요청 없이 즉시 데이터를 표시한다.
 */
function makeClient(queryKey: unknown[], pageData: unknown) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(queryKey, { pages: [pageData], pageParams: [null] });
  return client;
}

const clients = {
  // queryKey는 각 infiniteQueryOptions의 queryKey와 일치해야 한다
  default: makeClient(['cover', 'group-123'], buildCoverPage('group-123')),
  groupMonthly: makeClient(['cover', 'group-123', '2025-01'], buildCoverPage('group-123')),
  personal: makeClient(['cover', 'my', '2025-01'], buildCoverPage('personal')),
  noPhotos: makeClient(['cover', 'group-empty'], {
    groupId: 'group-empty',
    sections: [],
    pageInfo: { hasNext: false, nextCursor: null },
  }),
};

function GalleryDrawerWrapper({
  type,
  groupId,
  month,
  className,
}: {
  type: 'group' | 'personal' | 'other';
  groupId?: string;
  month?: string;
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#10B981] text-white font-bold text-sm transition-all active:scale-95 cursor-pointer">
          <ImageIcon className="w-4 h-4" />
          커버 사진 선택 열기
        </button>
      </DrawerTrigger>

      <DrawerContent className={`w-full px-8 py-4 pb-10 ${className ?? ''}`}>
        <DrawerHeader>
          <div className="pt-4 flex justify-between items-center mb-6">
            <DrawerTitle className="flex flex-col">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                CHOOSE COVER
              </span>
              <span className="text-lg font-bold dark:text-white text-itta-black">
                커버 사진 선택
              </span>
            </DrawerTitle>
            <DrawerClose className="p-2 text-gray-400 cursor-pointer">
              <X className="w-6 h-6" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <GalleryDrawer
          type={type}
          groupId={groupId}
          month={month}
          currentAssetId={selectedId ?? undefined}
          onSelect={(mediaId) => setSelectedId(mediaId)}
        />
      </DrawerContent>
    </Drawer>
  );
}

const meta = {
  title: 'Record/GalleryDrawer',
  component: GalleryDrawerWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
그룹/개인 아카이브에서 커버 이미지를 선택하는 드로어 컴포넌트.

"커버 사진 선택 열기" 버튼을 클릭하면 드로어가 열리고, 기록에 포함된 이미지 목록이 그리드로 표시된다.
이미지를 클릭하면 해당 이미지가 커버로 설정되고 드로어가 자동으로 닫힌다.
"기본 커버로 변경" 버튼으로 커버를 초기화할 수 있다.

- \`type="group"\`: 그룹 대표 커버 또는 월별 커버 선택
- \`type="personal"\`: 개인 아카이브 월별 커버 선택
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GalleryDrawerWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { type: 'group', groupId: 'group-123' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="p-10 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '그룹 대표 커버 선택. "커버 사진 선택 열기" 버튼을 클릭해 드로어를 연다.',
      },
    },
  },
};

export const GroupMonthly: Story = {
  args: { type: 'group', groupId: 'group-123', month: '2025-01' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.groupMonthly}>
        <div className="p-10 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: { story: '그룹의 특정 월 커버 선택.' },
    },
  },
};

export const Personal: Story = {
  args: { type: 'personal', month: '2025-01' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.personal}>
        <div className="p-10 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: { story: '개인 아카이브의 월별 커버 선택.' },
    },
  },
};

export const NoPhotos: Story = {
  args: { type: 'group', groupId: 'group-empty' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.noPhotos}>
        <div className="p-10 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '커버로 설정할 이미지가 없는 경우 — "이미지가 포함된 기록이 없어요" 안내 메시지가 표시된다.',
      },
    },
  },
};

