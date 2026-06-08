import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60000,
  reporter: [['html', { open: 'never' }], ['line']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /setup\/.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/guest.json',
      },
      dependencies: ['setup'],
      testIgnore: /share\.spec\.ts/,
    },
    {
      name: 'chromium-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /share\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],

  // E2E 테스트는 프로덕션 빌드 서버 + 백엔드가 실행 중인 상태에서 실행합니다.
  // 사전 준비: pnpm infra:up && pnpm dev:be
  // (dev 서버가 실행 중이면 먼저 종료 후 실행)
  webServer: {
    command: 'NEXT_PUBLIC_PRODUCTION_API_URL=http://localhost:4000 pnpm build && NEXT_PUBLIC_PRODUCTION_API_URL=http://localhost:4000 pnpm start',
    url: 'http://localhost:3000/favicon.ico',
    reuseExistingServer: false,
    timeout: 180 * 1000,
  },
});
