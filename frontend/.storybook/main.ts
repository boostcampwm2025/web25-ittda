import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    'msw-storybook-addon',
  ],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  // experimentalRSC: true 는 Controls(args) 변경 시 서버 재렌더링이 트리거되지 않아
  // imageLayout 같은 prop 제어가 동작하지 않는 문제를 일으킨다.
  // 실제 RSC 스토리가 없으므로 비활성화한다.
  viteFinal: async (config) => {
    // next-auth의 ua-parser-js(CJS 빌드)가 __dirname을 사용하는데,
    // Vite가 브라우저 번들로 변환할 때 정의되지 않아 ReferenceError가 발생함.
    config.define = {
      ...config.define,
      __dirname: JSON.stringify(''),
    };
    return config;
  },
};
export default config;
