'use strict';

/**
 * Lighthouse CI Puppeteer setup script
 * Authenticates as a guest user before running Lighthouse measurements
 */
module.exports = async (browser, _context) => {
  // Node.js fetch로 직접 게스트 토큰 발급 (page.goto 불필요)
  const res = await fetch('http://localhost:3000/api/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  if (!res.ok) {
    throw new Error(`Guest auth failed: HTTP ${res.status}`);
  }

  const authHeader = res.headers.get('Authorization') || res.headers.get('authorization');
  const accessToken = authHeader ? authHeader.replace('Bearer ', '') : null;
  const data = await res.json();
  const { guestSessionId } = data;

  if (!accessToken || !guestSessionId) {
    throw new Error(`Guest auth missing token: ${JSON.stringify({ accessToken, guestSessionId })}`);
  }

  // 쿠키를 도메인에 설정 (브라우저 컨텍스트 전체에 적용)
  await browser.defaultBrowserContext().setCookie(
    {
      name: 'x-guest-session-id',
      value: guestSessionId,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
    {
      name: 'x-guest-access-token',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  );

  // Zustand persist 상태를 localStorage에 설정 (최소한의 페이지 이동만)
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.evaluate(
    (state) => {
      localStorage.setItem('auth-storage', JSON.stringify(state));
    },
    {
      state: {
        userType: 'guest',
        userId: null,
        guestSessionId,
        guestAccessToken: accessToken,
        guestSessionExpiresAt: guestSessionId,
        isLoggedIn: true,
      },
      version: 0,
    },
  );
  await page.close();
};
