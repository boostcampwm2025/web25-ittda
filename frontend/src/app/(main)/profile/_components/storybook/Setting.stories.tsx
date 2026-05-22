import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Setting from '../Setting';

// ThemeProvider는 preview.tsx 전역 데코레이터가 담당한다.
// 각 스토리는 globals.theme으로 초기 테마를 지정하고,
// Storybook 툴바로 언제든 전환할 수 있다.

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta = {
  title: 'Profile/Setting',
  component: Setting,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '프로필 페이지의 설정 섹션 컴포넌트입니다. 다크/라이트 테마 전환 토글, 버전 정보, 공지사항·문의하기·개인정보처리방침 링크, 앱 설치 버튼을 포함합니다. 로그인 상태일 때는 로그아웃·탈퇴하기 버튼이 추가로 표시됩니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof Setting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    globals: { theme: 'light' },
    docs: {
      description: {
        story: `
라이트 모드 — 태양 아이콘과 회색 토글로 표시됩니다.
- **테마 토글**: 라이트↔다크 모드 전환 (태양 아이콘+회색 / 달 아이콘+보라색)
- **로그아웃 버튼**: 로그인 상태일 때만 표시. 클릭 시 로그아웃 후 로그인 페이지로 이동
- **탈퇴하기 버튼**: 로그인 상태일 때만 표시. 클릭 시 확인 Drawer — 취소/탈퇴하기(빨간색) 버튼 포함
- **버전 정보**: 앱 버전 번호(v1.0.0) 표시
        `,
      },
    },
  },
};

