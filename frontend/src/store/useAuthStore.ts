import { clearTokens, setAccessToken } from '@/lib/api/auth';
import { GuestInfo, UserType } from '@/lib/types/profile';
import { UserLoginResponse } from '@/lib/types/response';
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
      },
      setGuestInfo: (guest) =>
        set({
          guestSessionId: guest.guestSessionId,
          guestSessionExpiresAt: guest.guestSessionId,
          userType: 'guest',
        }),
      switchGuestToSocial: (socialUser) => {
        set({
          userType: 'social',
          userId: socialUser.user.id,
          isLoggedIn: true,
          guestSessionId: null,
          guestSessionExpiresAt: null,
        });
        setAccessToken(socialUser.accessToken);
      },
      logout: () => {
        set({
          userType: null,
          isLoggedIn: false,
          guestSessionId: null,
          guestSessionExpiresAt: null,
        });
        clearTokens();
        // 필요 시 여기서 tanstack query 캐시를 날리거나 쿠키 삭제
      },
    }),
    { name: 'auth-storage' },
  ),
);
