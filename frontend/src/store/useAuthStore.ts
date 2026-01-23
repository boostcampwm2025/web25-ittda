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
    (set, get) => ({
      userType: null,
      userId: null,
      guestSessionId: null,
      guestSessionExpiresAt: null,
      isLoggedIn: false,

      setLogin: (socialUser) => {
        const { guestSessionId } = get();

        if (guestSessionId) {
          // 게스트 → 소셜 전환
          set({
            userType: 'social',
            userId: socialUser.id,
            isLoggedIn: true,
            guestSessionId: null,
            guestSessionExpiresAt: null,
          });
        } else {
          set({
            userType: 'social',
            userId: socialUser.id,
            isLoggedIn: true,
          });
        }
        Cookies.remove(guestCookieKey);
      },

      setSocialLogin: () => {
        set({
          userType: 'social',
          isLoggedIn: true,
        });
        Cookies.remove(guestCookieKey);
      },

      setGuestInfo: (guest) => {
        set({
          guestSessionId: guest.guestSessionId,
          guestSessionExpiresAt: guest.guestSessionId,
          userType: 'guest',
          isLoggedIn: true,
        });

        setGuestCookie(guest.guestSessionId);
      },

      logout: () => {
        set({
          userType: null,
          userId: null,
          isLoggedIn: false,
          guestSessionId: null,
          guestSessionExpiresAt: null,
        });
        // 로그아웃 시 쿠키 명시적 삭제
        Cookies.remove(guestCookieKey);
      },
    }),
    { name: 'auth-storage' },
  ),
);
