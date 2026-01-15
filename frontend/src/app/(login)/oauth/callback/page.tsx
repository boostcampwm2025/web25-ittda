'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import LoginContent from '../../login/_components/LoginContent';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // OAuth 인증 코드가 없으면 로그인 페이지로
      if (!code) {
        router.push('/login?error=invalid_callback');
        return;
      }

      try {
        // state에서 provider 정보 추출 (예: "google" 또는 "kakao")
        const provider = state?.split('-')[0] || 'google';

        // 1. 백엔드로 인증 코드 전송하여 access token 발급
        const response = await fetch(`/api/v1/auth/${provider}/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
          }),
          credentials: 'include', // 쿠키 포함
        });

        if (!response.ok) {
          throw new Error('OAuth callback failed');
        }

        const data = await response.json();

        // 2. 로그인 성공 - 홈으로 리디렉션
        router.push('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        router.push('/login?error=login_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  return (
    <>
      <LoginContent />
      <AuthLoadingScreen />
    </>
  );
}
