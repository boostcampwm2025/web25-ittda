'use client';

import { clearTokens, setAccessToken } from '@/lib/api/auth';
import { GuestInfo, UserType } from '@/lib/types/profile';
import { UserLoginResponse } from '@/lib/types/response';
import Cookies from 'js-cookie';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface State {
  userType: UserType | null;
  userId: string | null;
  guestSessionId: string | null;
  guestSessionExpiresAt: string | null;
  isLoggedIn: boolean;
}

interface Action {
  setLogin: (socialUser: UserLoginResponse) => void;
  setGuestInfo: (guest: GuestInfo) => void;
  switchGuestToSocial: (user: UserLoginResponse) => void;
  logout: () => void;
}

const guestCookieKey = 'x-guest-session-id';

// 쿠키에 세션 ID를 설정하는 헬퍼 함수
const setGuestCookie = (sessionId: string) => {
  Cookies.set(guestCookieKey, sessionId, {
    expires: 3, // 3일 동안 유지
    path: '/', // 모든 경로에서 쿠키 전송
    sameSite: 'Lax', // 소셜 로그인 리다이렉트 시 쿠키 전송 허용
  });
};

export const useAuthStore = create<State & Action>()(
  persist(
    (set) => ({
      userType: null,
      userId: null,
      guestSessionId: null,
      guestSessionExpiresAt: null,
      isLoggedIn: false,

      setLogin: (socialUser) => {
        set({
          userType: 'social',
          userId: socialUser.user.id,
          isLoggedIn: true,
        });
        setAccessToken(socialUser.accessToken);
        // 소셜 로그인 시에는 게스트 쿠키 삭제
        Cookies.remove(guestCookieKey);
      },

      setGuestInfo: (guest) => {
        set({
          guestSessionId: guest.guestSessionId,
          guestSessionExpiresAt: guest.guestSessionId,
          userType: 'guest',
        });

        setGuestCookie(guest.guestSessionId);
      },

      switchGuestToSocial: (socialUser) => {
        set({
          userType: 'social',
          userId: socialUser.user.id,
          isLoggedIn: true,
          guestSessionId: null,
          guestSessionExpiresAt: null,
        });
        setAccessToken(socialUser.accessToken);
        // 전환 시 쿠키 삭제
        Cookies.remove(guestCookieKey);
      },

      logout: () => {
        set({
          userType: null,
          userId: null,
          isLoggedIn: false,
          guestSessionId: null,
          guestSessionExpiresAt: null,
        });
        clearTokens();
        // 로그아웃 시 쿠키 명시적 삭제
        Cookies.remove(guestCookieKey);
      },
    }),
    { name: 'auth-storage' },
  ),
);
