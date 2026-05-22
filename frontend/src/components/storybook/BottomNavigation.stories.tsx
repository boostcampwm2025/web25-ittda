import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BottomNavigation from '../BottomNavigation';
import { createMockGroupList } from '@/lib/mocks/mock';

const GROUP_ID = 'group-123';

function makeClient(role?: 'ADMIN' | 'EDITOR' | 'VIEWER') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  // /shared 경로에서 그룹 목록을 prefetch하므로 미리 주입
  client.setQueryData(['shared'], createMockGroupList().items);
  // 그룹 네비 스토리에서 role 주입
  if (role) {
    client.setQueryData(['group', GROUP_ID, 'me', 'role'], { role });
  }
  return client;
}

const clients = {
  personal: makeClient(),
  groupEditor: makeClient('EDITOR'),
  groupViewer: makeClient('VIEWER'),
};

function NavWrapper({
  children,
  client,
}: {
  children: React.ReactNode;
  client: QueryClient;
}) {
  return (
    <QueryClientProvider client={client}>
      <div className="relative h-56 bg-[#F9F9F9] dark:bg-[#121212]">
        <p className="text-xs text-gray-400 text-center pt-4">페이지 콘텐츠 영역</p>
        {children}
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Layout/BottomNavigation',
  component: BottomNavigation,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    docs: {
      story: { height: '220px' },
      description: {
        component: `
모바일 화면 하단에 고정되는 네비게이션 바.

현재 경로에 따라 **개인 네비**와 **그룹 네비** 두 가지 형태로 전환된다.
일부 경로(\`/add\`, \`/search\` 등)에서는 숨겨진다.

**개인 네비** (기본): 홈 · 기록함 · + · 그룹함 · 지도

**그룹 네비** (\`/group/:id\` 경로): 그룹홈 · 지도 · + · 알림 · 나가기

- **+ 버튼**: 개인 — 기록 작성(\`/add\`) 이동 · 그룹함(\`/shared\`)에서는 그룹 선택 드로어
- **+ 버튼 (그룹)**: EDITOR 이상만 활성화, VIEWER는 비활성(회색)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── 개인 네비게이션 ───────────────────────────────────────────────────────────

export const PersonalHome: Story = {
  decorators: [(Story) => <NavWrapper client={clients.personal}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: '/' } },
    docs: {
      description: { story: '개인 네비 — 홈 탭 활성 상태.' },
    },
  },
};

export const PersonalRecords: Story = {
  decorators: [(Story) => <NavWrapper client={clients.personal}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: '/my' } },
    docs: {
      description: { story: '개인 네비 — 기록함 탭 활성 상태.' },
    },
  },
};

export const PersonalShared: Story = {
  decorators: [(Story) => <NavWrapper client={clients.personal}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: '/shared' } },
    docs: {
      description: {
        story: '개인 네비 — 그룹함 탭 활성 상태. + 버튼이 초록색으로 변경되며 클릭 시 그룹 선택 드로어가 열린다.',
      },
    },
  },
};

export const PersonalMap: Story = {
  decorators: [(Story) => <NavWrapper client={clients.personal}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: '/map' } },
    docs: {
      description: { story: '개인 네비 — 지도 탭 활성 상태.' },
    },
  },
};

// ─── 그룹 네비게이션 ───────────────────────────────────────────────────────────

export const GroupEditor: Story = {
  decorators: [(Story) => <NavWrapper client={clients.groupEditor}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: `/group/${GROUP_ID}` } },
    docs: {
      description: {
        story: '그룹 네비 — EDITOR 권한. + 버튼이 활성화되어 그룹 기록 작성 드로어를 열 수 있다.',
      },
    },
  },
};

export const GroupViewer: Story = {
  decorators: [(Story) => <NavWrapper client={clients.groupViewer}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: `/group/${GROUP_ID}` } },
    docs: {
      description: {
        story: '그룹 네비 — VIEWER 권한. + 버튼이 회색으로 비활성화된다.',
      },
    },
  },
};

export const GroupMap: Story = {
  decorators: [(Story) => <NavWrapper client={clients.groupEditor}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: `/group/${GROUP_ID}/map` } },
    docs: {
      description: { story: '그룹 네비 — 지도 탭 활성 상태.' },
    },
  },
};

export const GroupNotifications: Story = {
  decorators: [(Story) => <NavWrapper client={clients.groupEditor}><Story /></NavWrapper>],
  parameters: {
    nextjs: { navigation: { pathname: `/group/${GROUP_ID}/notifications` } },
    docs: {
      description: { story: '그룹 네비 — 알림 탭 활성 상태.' },
    },
  },
};
