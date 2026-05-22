import type { Preview, Decorator } from '@storybook/nextjs-vite';
import { ThemeProvider } from 'next-themes';
import { initialize, mswLoader } from 'msw-storybook-addon';
import '../src/app/globals.css';

initialize();

// 모든 스토리를 ThemeProvider로 감싸 useTheme()이 어디서든 동작하게 한다.
// forcedTheme을 Storybook 글로벌 theme 값으로 고정해 스토리 간 html.dark 오염을 차단한다.
// 각 스토리는 parameters.globals.theme으로 초기 테마를 지정하고,
// Storybook 툴바(우상단 테마 토글)로 언제든 전환할 수 있다.
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? 'light';
  return (
    <ThemeProvider attribute="class" forcedTheme={theme} enableSystem={false}>
      <Story />
    </ThemeProvider>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        segments: ['groupId', 'month', 'year', 'date', 'userId', 'recordId'],
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [withTheme],
  loaders: [mswLoader],
};

export default preview;
