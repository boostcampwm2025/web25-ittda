import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AssetImage from '@/components/AssetImage';

interface Announcement {
  id: string;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

function formatKoreanDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-4 shadow-sm">
      {announcement.imageUrl && (
        <div className="relative w-full h-36 mb-3 rounded-xl overflow-hidden">
          <AssetImage
            assetId={announcement.imageUrl}
            alt={announcement.title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        {announcement.isActive && (
          <span className="shrink-0 text-[10px] font-bold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
            진행 중
          </span>
        )}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {announcement.title}
        </h3>
      </div>
      {announcement.content && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 whitespace-pre-line">
          {announcement.content}
        </p>
      )}
      <p className="text-[11px] text-gray-400 mt-1.5">
        {formatKoreanDate(announcement.createdAt)}
      </p>
    </div>
  );
}

function AnnouncementsPage({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <header className="sticky top-0 z-50 max-w-4xl w-full mx-auto px-4 py-3 sm:px-5 sm:py-6 flex items-center justify-between dark:bg-[#121212] bg-white">
        <div className="w-6 h-6" />
        <h2 className="text-sm sm:text-base font-medium dark:text-white text-itta-black">
          공지사항
        </h2>
        <div className="w-6 h-6" />
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-5 py-4 sm:py-6 flex flex-col gap-3 sm:gap-4">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <p className="text-sm sm:text-base font-medium">공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))
        )}
      </main>
    </div>
  );
}

// ─── Mock 데이터 ──────────────────────────────────────────────────────────────
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '[업데이트] 공동 기록 실시간 협업 기능 출시',
    content:
      '그룹 기록을 여러 명이 동시에 편집할 수 있는 실시간 협업 기능이 추가되었습니다.\n함께 기억을 남겨보세요!',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=896',
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: '[공지] 서비스 점검 안내 (1/20 02:00 ~ 04:00)',
    content:
      '서버 안정화 작업으로 인해 서비스 점검이 진행됩니다.\n점검 시간 동안 서비스 이용이 일시 중단됩니다.',
    imageUrl: null,
    isActive: false,
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: '3',
    title: '[이벤트] 잇다- 베타 출시 기념 이벤트',
    content: '베타 기간 동안 피드백을 남겨주신 분들께 특별한 혜택을 드립니다.',
    imageUrl: null,
    isActive: false,
    createdAt: '2025-12-01T00:00:00Z',
  },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────
const meta = {
  title: 'Pages/AnnouncementsPage',
  component: AnnouncementsPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component: `
프로필 페이지에서 접근할 수 있는 공지사항 목록 페이지.

서버에서 공지사항을 불러와 카드 형태로 나열한다.

- **이미지**: 공지에 이미지가 있으면 카드 상단에 배너로 표시
- **진행 중 배지**: \`isActive: true\`인 공지에만 초록색 배지 표시
- **빈 상태**: 공지가 없으면 "공지사항이 없습니다." 안내 표시

> 실제 페이지는 RSC로 서버에서 데이터를 fetch하며, 스토리에서는 mock 데이터로 동일한 UI를 확인한다.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { announcements: mockAnnouncements },
  parameters: {
    docs: {
      description: {
        story: `
이미지 있는 진행 중 공지, 이미지 없는 공지, 종료된 공지가 섞인 일반적인 목록 상태.

- **"진행 중" 배지**: 첫 번째 카드에만 표시
- **이미지 배너**: 첫 번째 카드에만 표시
        `,
      },
    },
  },
};

export const Empty: Story = {
  args: { announcements: [] },
  parameters: {
    docs: {
      description: {
        story: '공지사항이 없는 경우 — "공지사항이 없습니다." 안내 문구가 중앙에 표시된다.',
      },
    },
  },
};

export const WithImageOnly: Story = {
  args: {
    announcements: [
      {
        id: '1',
        title: '[업데이트] 공동 기록 실시간 협업 기능 출시',
        content: '그룹 기록을 여러 명이 동시에 편집할 수 있는 실시간 협업 기능이 추가되었습니다.',
        imageUrl:
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=896',
        isActive: true,
        createdAt: '2026-01-15T10:00:00Z',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '이미지와 "진행 중" 배지가 모두 있는 단일 공지 — 카드 상단에 배너 이미지가 표시된다.',
      },
    },
  },
};

export const TextOnly: Story = {
  args: {
    announcements: [
      {
        id: '2',
        title: '[공지] 서비스 점검 안내 (1/20 02:00 ~ 04:00)',
        content:
          '서버 안정화 작업으로 인해 서비스 점검이 진행됩니다.\n점검 시간 동안 서비스 이용이 일시 중단됩니다.',
        imageUrl: null,
        isActive: false,
        createdAt: '2026-01-10T09:00:00Z',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '이미지 없이 텍스트만 있는 공지 — 제목·내용·날짜만 표시된다.',
      },
    },
  },
};
