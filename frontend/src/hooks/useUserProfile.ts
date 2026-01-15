import { UserProfile } from '@/lib/types/profile';
import { useApiQuery } from './useApi';
import { useAuthStore } from '@/store/useAuthStore';

export const useUserProfile = () => {
  const { userId, isLoggedIn, userType } = useAuthStore();

  return useApiQuery<UserProfile>(
    ['user', 'profile', userId],
    `/api/users/${userId}`,
    {
      enabled: isLoggedIn && userType === 'social' && !!userId, // 소셜 로그인 유저만 API 호출
      staleTime: 1000 * 60 * 5, // 5분 동안 신선한 데이터로 간주
      gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 안 함
    },
  );
};
