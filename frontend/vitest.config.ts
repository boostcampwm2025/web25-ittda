import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.tsx',
        'src/**/*.d.ts',
      ],
      // 순수 로직 레이어(utils/hooks/store)에만 거는 후퇴 방지용 floor.
      // 아래 수치는 "목표치"가 아니라 현재 실측값 기준 — 새 테스트가 쌓이면 올린다.
      // 컴포넌트/페이지는 이질적인 코드가 섞여 있어 threshold 대상에서 제외하고
      // PR의 파일별 커버리지 diff를 리뷰로 판단한다.
      thresholds: {
        'src/lib/utils/**': { lines: 65, statements: 65 },
        'src/hooks/**': { lines: 45, statements: 40 },
        'src/store/**': { lines: 45, statements: 45 },
      },
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
        },
        resolve: {
          alias: {
            // tsconfig.json의 "@/_lib/*": ["src/lib/*"]와 동일 — 더 일반적인
            // '@' 별칭보다 먼저 매칭되어야 하므로 순서상 위에 둔다.
            '@/_lib': path.resolve(dirname, 'src/lib'),
            '@': path.resolve(dirname, 'src'),
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
