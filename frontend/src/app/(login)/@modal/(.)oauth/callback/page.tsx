'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { get } from '@/lib/api/api';
import { UserProfile } from '@/lib/types/profile';
import { UserLoginResponse } from '@/lib/types/response';
import { useAuthStore } from '@/store/useAuthStore';
import { setAccessToken } from '@/lib/api/auth';

export default function OAuthCallbackModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setLogin, setSocialLogin } = useAuthStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');

      // OAuth 인증 코드가 없으면 로그인 페이지로
      if (!code) {
        router.push('/login?error=invalid_callback');
        return;
      }

      try {
        // 백엔드로 인증 코드 전송하여 access token 발급
        const response = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!data.success) {
          router.push(`/login?error=${data.error.code}`);
          return;
        }

        // Header에서 access token 추출
        const authHeader = response.headers.get('Authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        if (!accessToken) {
          router.push('/login?error=token_not_found');
          return;
        }

        setAccessToken(accessToken);

        // 유저 프로필 정보 조회 및 캐시에 저장
        const userResponse = await get<UserLoginResponse>('/api/me');

        if (userResponse.success) {
          setLogin(userResponse.data);

          // useUserProfile에서 사용하는 쿼리 키와 동일하게 캐시에 저장
          queryClient.setQueryData<UserProfile>(['user', 'profile'], {
            id: userResponse.data.id,
            email: userResponse.data.email,
            nickname: userResponse.data.nickname,
            profileImageUrl: userResponse.data.profileImageUrl,
            provider: 'kakao',
            createdAt: userResponse.data.createdAt,
          });
        } else {
          // 프로필 조회 실패 시 로그인 상태만 설정 (useUserProfile에서 재시도)
          setSocialLogin();
        }

        router.push('/');
      } catch {
        router.push('/login?error=login_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, router, setLogin, setSocialLogin, queryClient]);

  return <AuthLoadingScreen />;
}
