import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnnouncementModalClient from '../AnnouncementModalClient';
import type { AnnouncementData } from '../AnnouncementModal';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockHandlers = [
  http.patch('/api/me/settings', () => HttpResponse.json({ success: true })),
];

const withImageAnnouncement: AnnouncementData = {
  id: 'ann-1',
  title: '[업데이트] 공동 기록 실시간 협업 기능 출시',
  content:
    '그룹 기록을 여러 명이 동시에 편집할 수 있는 실시간 협업 기능이 추가되었습니다.\n함께 기억을 남겨보세요!',
  imageUrl:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600',
};

const textOnlyAnnouncement: AnnouncementData = {
  id: 'ann-2',
  title: '[공지] 서비스 점검 안내 (1/20 02:00 ~ 04:00)',
  content:
    '서버 안정화 작업으로 인해 서비스 점검이 진행됩니다.\n점검 시간 동안 서비스 이용이 일시 중단됩니다.',
  imageUrl: null,
};

const titleOnlyAnnouncement: AnnouncementData = {
  id: 'ann-3',
  title: '[이벤트] 잇다- 베타 출시 기념 이벤트가 시작되었습니다!',
  content: null,
  imageUrl: null,
};

const meta = {
  title: 'Pages/AnnouncementModal',
  component: AnnouncementModalClient,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    msw: { handlers: mockHandlers },
    docs: {
      description: {
        component: `
홈 페이지 진입 시 활성 공지사항이 있으면 자동으로 표시되는 모달 컴포넌트.

배경 오버레이 위에 공지 카드가 중앙 팝업으로 나타나며, X 버튼 또는 "확인" 버튼으로 닫을 수 있다.
닫으면 해당 공지 ID를 서버 설정(로그인) 또는 쿠키(게스트)에 저장해 재표시하지 않는다.

- **imageUrl**: 이미지가 있으면 카드 상단에 16:9 비율로 표시
- **content**: 내용이 없으면 제목만 표시
- **X 버튼 / 확인 버튼 / 배경 클릭**: 모두 닫기 동작
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="relative min-h-screen bg-[#F9F9F9] dark:bg-[#121212]">
          <div className="p-6 text-sm text-gray-400">홈 페이지 콘텐츠 영역</div>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof AnnouncementModalClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { announcement: withImageAnnouncement },
  parameters: {
    docs: {
      description: {
        story: `
이미지와 내용이 모두 있는 공지 모달 — 가장 일반적인 형태.

- **배경 클릭 / X 버튼 / 확인 버튼**: 모달 닫기 → API로 dismissed 상태 저장
        `,
      },
    },
  },
};

export const TextOnly: Story = {
  args: { announcement: textOnlyAnnouncement },
  parameters: {
    docs: {
      description: {
        story: '이미지 없이 제목·내용만 있는 공지 모달.',
      },
    },
  },
};

export const TitleOnly: Story = {
  args: { announcement: titleOnlyAnnouncement },
  parameters: {
    docs: {
      description: {
        story: '제목만 있고 내용이 없는 공지 모달 — 제목과 확인 버튼만 표시된다.',
      },
    },
  },
};
