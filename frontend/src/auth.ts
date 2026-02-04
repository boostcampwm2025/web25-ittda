import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { refreshServerAccessToken } from './lib/api/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'OAuthExchange',
      async authorize(credentials, request) {
        // request는 NextAuth가 호출할 때 넘겨주는 요청 객체
        let guestSessionId: string | undefined;
        if (request) {
          const cookieHeader = request.headers.get('cookie') || '';
          const match = cookieHeader.match(
            /(?:^|;)\s*x-guest-session-id=([^;]*)/,
          );
          if (match) {
            guestSessionId = match[1];
          }
        }

        // credentials로 전달받은 code를 백엔드에 전달
        const exchangeRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/exchange`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(guestSessionId
                ? { 'x-guest-session-id': guestSessionId }
                : {}),
            },
            body: JSON.stringify({ code: credentials.code }),
          },
        );

        if (!exchangeRes.ok) return null;

        const authHeader = exchangeRes.headers.get('Authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        // 백엔드에서 Set-Cookie로 준 RefreshToken은 브라우저 쿠키에 자동 저장
        const cookieHeader = exchangeRes.headers.get('set-cookie');
        const refreshCookiePart = cookieHeader
          ?.split(';')
          .find((c) => c.trim().startsWith('refreshToken='));
        const refreshToken = refreshCookiePart
          ?.trim()
          .substring('refreshToken='.length);

        return {
          id: 'logged_in_user',
          accessToken,
          refreshToken, // JWT 콜백으로 전달
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // authoize에서 반환한 값이 여기 user에 담김
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires:
            Date.now() +
            15 * 60 * 1000 -
            60 * 1000 -
            Math.floor(Math.random() * 10000), // 서버 토큰 만료 시간보다 조금 이르게(14분) 잡아서 401 방지
        };
      }

      // 이전 갱신에서 에러가 발생했다면, 더 이상 갱신 시도하지 않음
      if (token.error === 'RefreshAccessTokenError') {
        return { ...token, accessToken: null };
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // 토큰 만료 시 새 토큰으로 갱신
      return refreshServerAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
});
