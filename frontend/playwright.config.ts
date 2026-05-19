import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 30000,
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

  // E2E 테스트는 개발 서버(포트 3000) + 백엔드가 실행 중인 상태에서 실행합니다.
  // 사전 준비: pnpm infra:up && pnpm dev:be && pnpm dev:fe
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/favicon.ico',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
