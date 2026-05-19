import { test as setup, expect, request as playwrightRequest } from '@playwright/test';

const GUEST_STATE_PATH = 'e2e/.auth/guest.json';

setup('게스트 인증 상태 설정', async ({ page }) => {
  setup.setTimeout(60000); // 백엔드 cold start 고려

  // page.request 대신 독립 request context 사용 — 페이지 로드 실패에 영향받지 않음
  const apiContext = await playwrightRequest.newContext({
    baseURL: 'http://localhost:3000',
  });

  const response = await apiContext.post('/api/auth/guest');
  const responseText = await response.text();
  console.log('auth/guest status:', response.status(), 'body:', responseText.slice(0, 300));
  expect([200, 201]).toContain(response.status());

  const body = await response.json();
  const authHeader = response.headers()['authorization'] ?? '';
  const guestAccessToken = authHeader.replace('Bearer ', '');
  const guestSessionId = body?.data?.guestSessionId ?? '';

  expect(guestSessionId).toBeTruthy();
  expect(guestAccessToken).toBeTruthy();

  await apiContext.dispose();

  // 쿠키를 먼저 설정한 뒤 페이지 로드
  await page.context().addCookies([
    { name: 'x-guest-session-id', value: guestSessionId, domain: 'localhost', path: '/' },
    { name: 'x-guest-access-token', value: guestAccessToken, domain: 'localhost', path: '/' },
  ]);

  // /login은 PUBLIC_PATHS라 인증 없이 빠르게 로드됨 → localStorage 주입 용도
  await page.goto('/login');

  await page.evaluate(
    ({ sessionId, token }) => {
      const authState = {
        state: {
          userType: 'guest',
          userId: null,
          guestSessionId: sessionId,
          guestAccessToken: token,
          guestSessionExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          isLoggedIn: true,
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    },
    { sessionId: guestSessionId, token: guestAccessToken },
  );

  await page.context().storageState({ path: GUEST_STATE_PATH });
});
