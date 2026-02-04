'use client';

import { GuestInfo, UserType } from '@/lib/types/profile';
import { UserLoginResponse } from '@/lib/types/response';
import Cookies from 'js-cookie';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface State {
  userType: UserType | null;
  userId: string | null;
  guestSessionId: string | null;
  guestAccessToken: string | null;
  guestSessionExpiresAt: string | null;
  isLoggedIn: boolean;
}

interface Action {
  setLogin: (socialUser: UserLoginResponse) => void;
  setSocialLogin: () => void; // 프로필 조회 실패 시 로그인 상태만 설정
  setGuestInfo: (guest: GuestInfo) => void;
  logout: () => void;
}

export const guestCookieKey = 'x-guest-session-id';
export const guestTokenKey = 'x-guest-access-token';

// 쿠키에 세션 ID를 설정하는 헬퍼 함수
const setGuestCookie = (key: string, sessionId: string) => {
  Cookies.set(key, sessionId, {
    expires: 3, // 3일 동안 유지
    path: '/', // 모든 경로에서 쿠키 전송
    sameSite: 'Lax', // 소셜 로그인 리다이렉트 시 쿠키 전송 허용
  });
};

export const useAuthStore = create<State & Action>()(
  persist(
    (set, get) => ({
      userType: null,
      userId: null,
      guestAccessToken: null,
      guestSessionId: null,
      guestSessionExpiresAt: null,
      isLoggedIn: false,

      setLogin: (socialUser) => {
        const { guestSessionId } = get();

        if (guestSessionId) {
          // 게스트 → 소셜 전환
          requestAnimationFrame(() => {
            set({
              userType: 'social',
              userId: socialUser.id,
              isLoggedIn: true,
              guestSessionId: null,
              guestAccessToken: null,
              guestSessionExpiresAt: null,
            });
          });
        } else {
          requestAnimationFrame(() => {
            set({
              userType: 'social',
              userId: socialUser.id,
              isLoggedIn: true,
            });
          });
        }
        Cookies.remove(guestCookieKey);
      },

      setSocialLogin: () => {
        requestAnimationFrame(() => {
          set({
            userType: 'social',
            isLoggedIn: true,
          });
          Cookies.remove(guestCookieKey);
        });
      },

      setGuestInfo: (guest) => {
        requestAnimationFrame(() => {
          set({
            guestAccessToken: guest.guestAccessToken,
            guestSessionId: guest.guestSessionId,
            guestSessionExpiresAt: guest.guestSessionId,
            userType: 'guest',
            isLoggedIn: true,
          });

          setGuestCookie(guestCookieKey, guest.guestSessionId);
          setGuestCookie(guestTokenKey, guest.guestAccessToken);
        });
      },

      logout: () => {
        set({
          userType: null,
          userId: null,
          isLoggedIn: false,
          guestAccessToken: null,
          guestSessionId: null,
          guestSessionExpiresAt: null,
        });
        // 로그아웃 시 쿠키 명시적 삭제
        Cookies.remove(guestCookieKey);
        Cookies.remove(guestTokenKey);
      },
    }),
    { name: 'auth-storage' },
  ),
);
