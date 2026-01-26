'use client';

import LoginContent from '@/app/(login)/login/_components/LoginContent';
import { useJoinGroup } from '@/hooks/useGroupInvite';
import { CACHE_TAGS } from '@/lib/api/cache';
import { invalidateCache } from '@/lib/api/cache-actions';
import { userProfileOptions } from '@/lib/api/profile';
import { deleteCookie, getCookie } from '@/lib/utils/cookie';
import { createApiError } from '@/lib/utils/errorHandler';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface OAuthCallbackContentProps {
  code: string | undefined;
  error: string | undefined;
}

export default function OAuthCallbackContent({
  code,
  error,
}: OAuthCallbackContentProps) {
  const router = useRouter();
  const inviteCode = getCookie('invite-code') || '';
  const queryClient = useQueryClient();
  const setLogin = useAuthStore((state) => state.setLogin);
  const setSocialLogin = useAuthStore((state) => state.setSocialLogin);
  const { mutateAsync: joinGroup } = useJoinGroup(inviteCode);

  useEffect(() => {
    // OAuth 인증 코드가 없으면 로그인 페이지로
    if (!code) {
      router.push('/login?error=invalid_callback');
      return;
    }

    const handleLogin = async () => {
      const result = await signIn('credentials', {
        code,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login?error=login_failed');
      } else {
        // 유저 프로필 조회 및 캐시 저장
        try {
          const profileData =
            await queryClient.fetchQuery(userProfileOptions());
          setLogin({
            id: profileData.userId,
            email: profileData.user.email ?? 'example.com',
            nickname: profileData.user.nickname ?? 'Anonymous',
            profileImageId: profileData.user.profileImage?.url ?? null,
            createdAt: profileData.user.createdAt,
          });
        } catch {
          // 프로필 조회 실패 시 로그인 상태만 설정
          setSocialLogin();
        }

        // 초대 코드 기반 그룹 자동 가입
        if (inviteCode) {
          joinGroup(
            {},
            {
              onSuccess: (response) => {
                const groupId = response.data.groupId;
                const groupName = response.data.group.name;
                if (!groupId) createApiError(response);
                deleteCookie('invite-code');
                invalidateCache(CACHE_TAGS.SHARED);
                toast.success(`${groupName} 그룹에 참여되었습니다!`);
                router.replace(`/group/${groupId}`);
              },
            },
          );
        }

        router.push('/');
      }
    };

    handleLogin();
  }, [
    code,
    router,
    queryClient,
    setLogin,
    setSocialLogin,
    inviteCode,
    joinGroup,
  ]);

  return <LoginContent error={error} />;
}
