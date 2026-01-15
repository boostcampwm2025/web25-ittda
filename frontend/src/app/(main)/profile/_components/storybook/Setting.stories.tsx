import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Setting from '../Setting';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';

// 다크 모드 상태로 렌더링하는 래퍼
function SettingDarkMode() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  return <Setting />;
}

// 라이트 모드 상태로 렌더링하는 래퍼
function SettingLightMode() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  return <Setting />;
}

const meta = {
  title: 'Profile/Setting',
  component: Setting,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Setting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '기본 설정 컴포넌트 - 다크 모드 토글, 버전 정보, 로그아웃, 탈퇴하기 포함',
      },
    },
  },
  decorators: [
    (Story) => {
      // 스토리가 렌더링될 때마다 테마 스토리지 초기화
      if (typeof window !== 'undefined') {
        localStorage.removeItem('storybook-theme-default');
      }
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="storybook-theme-default"
        >
          <div className="max-w-md mx-auto p-5 bg-[#F9F9F9]">
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};

export const LightMode: Story = {
  parameters: {
    docs: {
      description: {
        story: '라이트 모드 설정 - 태양 아이콘과 왼쪽에 있는 회색 토글 표시',
      },
    },
  },
  decorators: [
    (Story) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('storybook-theme-light');
      }
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="storybook-theme-light"
        >
          <div className="max-w-md mx-auto p-5 bg-[#F9F9F9]">
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
  render: () => <SettingLightMode />,
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story:
          '다크 모드 설정 - 달 아이콘과 오른쪽으로 이동한 보라색 토글 표시',
      },
    },
  },
  decorators: [
    (Story) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('storybook-theme-dark');
      }
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="storybook-theme-dark"
        >
          <div className="dark">
            <div className="max-w-md mx-auto p-5 bg-[#121212]">
              <Story />
            </div>
          </div>
        </ThemeProvider>
      );
    },
  ],
  render: () => <SettingDarkMode />,
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: `
설정 컴포넌트 기능:

**다크 모드 토글**
- 토글 버튼 클릭으로 라이트/다크 모드 전환
- 라이트 모드: 태양 ☀️ 아이콘, 회색 토글
- 다크 모드: 달 🌙 아이콘, 보라색 토글
- 애니메이션: 부드러운 슬라이드 전환

**기타 기능**
- 버전 정보: v1.0.0 표시
- 로그아웃: 로그아웃 처리
- 탈퇴하기: Drawer로 확인 후 탈퇴
  - 경고 아이콘과 메시지 표시
  - 취소 / 탈퇴하기 버튼
  - 탈퇴하기 버튼은 빨간색 강조
        `,
      },
    },
  },
  decorators: [
    (Story) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('storybook-theme-interactive');
      }
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="storybook-theme-interactive"
        >
          <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};

export const WithdrawalDrawer: Story = {
  parameters: {
    docs: {
      description: {
        story: '탈퇴하기 Drawer - "탈퇴하기" 버튼 클릭 시 표시되는 확인 창',
      },
    },
  },
  decorators: [
    (Story) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('storybook-theme-withdrawal');
      }
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="storybook-theme-withdrawal"
        >
          <div className="max-w-md mx-auto p-5 bg-[#F9F9F9]">
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};
