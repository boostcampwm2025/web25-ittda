'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { post } from '@/lib/api/api';
import { TempCodeResponse } from '@/lib/types/response';
import { useAuthStore } from '@/store/useAuthStore';
import { setAccessToken } from '@/lib/api/auth';

export default function OAuthCallbackModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLogin } = useAuthStore();

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
        const response = await post<TempCodeResponse>(
          `/api/auth/exchange`,
          {
            code,
          },
          {
            credentials: 'include',
          },
          true,
        );

        if (response.success) {
          setAccessToken(response.data.accessToken);

          router.push('/');
        } else if (!response.success) {
          router.push(`/login?error=${response.error.code}`);
        }
      } catch {
        router.push('/login?error=login_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  return <AuthLoadingScreen />;
}
