'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import LoginContent from '../../login/_components/LoginContent';
import { setAccessToken } from '@/lib/api/auth';
import { useJoinGroup } from '@/hooks/useGroupInvite';
import { deleteCookie, getCookie } from '@/lib/utils/cookie';
import { toast } from 'sonner';
import { createApiError } from '@/lib/utils/errorHandler';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = getCookie('invite-code') || '';
  const { mutateAsync: joinGroup } = useJoinGroup(inviteCode);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');

      // OAuth 인증 코드가 없으면 로그인 페이지로
      if (!code) {
        router.push('/login?error=invalid_callback');
        return;
      }

      try {
        // 1. 백엔드로 인증 코드 전송하여 access token 발급
        const response = await fetch(`/api/auth/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
          }),
          credentials: 'include', // 쿠키 포함
        });

        if (!response.ok) {
          throw new Error('OAuth callback failed');
        }

        const token = response.headers
          .get('Authorization')
          ?.replace('Bearer ', '');

        if (token) {
          setAccessToken(token);
        }

        const data = await response.json();
        // TODO: 유저 프로필 조회

        // 초대 코드 기반 그룹 자동 가입
        if (token && inviteCode) {
          joinGroup(
            {},
            {
              onSuccess: (response) => {
                const groupId = response.data.groupId;
                const groupName = response.data.group.name;
                if (!groupId) createApiError(response);
                deleteCookie('invite-code');
                toast.success(`${groupName} 그룹에 참여되었습니다!`);
                router.replace(`/group/${groupId}`);
              },
            },
          );
        }

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
