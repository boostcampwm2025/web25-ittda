'use strict';

/**
 * Lighthouse CI Puppeteer setup script
 * Authenticates as a guest user before running Lighthouse measurements
 */
module.exports = async (browser, _context) => {
  const page = await browser.newPage();

  // 도메인 컨텍스트 확보를 위해 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login', {
    waitUntil: 'domcontentloaded',
  });

  // 브라우저 컨텍스트 안에서 게스트 API 호출
  const authResult = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const authHeader =
        res.headers.get('Authorization') ||
        res.headers.get('authorization');
      const accessToken = authHeader ? authHeader.replace('Bearer ', '') : null;
      const data = await res.json();
      return { data, accessToken, ok: res.ok };
    } catch (e) {
      return { error: e.message, ok: false };
    }
  });

  if (!authResult.ok || !authResult.accessToken) {
    throw new Error(`Guest auth failed: ${JSON.stringify(authResult)}`);
  }

  const { accessToken, data } = authResult;
  const { guestSessionId } = data;

  // Zustand persist 상태를 localStorage에 직접 설정
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

  // 쿠키 설정 (API 요청 시 인증에 사용)
  await page.setCookie(
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

  await page.close();
};
