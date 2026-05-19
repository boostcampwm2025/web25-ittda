import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // dev 서버는 RSC 컴파일 부하가 크므로 로컬에서도 워커 수를 제한
  workers: process.env.CI ? 1 : 2,
  // dev 서버 RSC 렌더링 지연을 허용하기 위해 타임아웃 60초
  timeout: 60000,
  reporter: [['html', { open: 'never' }]],

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
