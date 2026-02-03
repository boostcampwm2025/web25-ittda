'use client';

import LoginContent from '@/app/(login)/login/_components/LoginContent';
import { useJoinGroup } from '@/hooks/useGroupInvite';
import { userProfileOptions } from '@/lib/api/profile';
import { deleteCookie, getCookie } from '@/lib/utils/cookie';
import { createApiError } from '@/lib/utils/errorHandler';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';

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
        let userId: string | null = null;
        try {
          const profileData =
            await queryClient.fetchQuery(userProfileOptions());
          userId = profileData.userId;
          const userInfo = {
            id: profileData.userId,
            email: profileData.user.email ?? 'example.com',
            nickname: profileData.user.nickname ?? 'Anonymous',
            profileImageId: profileData.user.profileImage?.url ?? null,
            createdAt: profileData.user.createdAt,
          };
          setLogin(userInfo);

          // Sentry에 사용자 정보 설정 (에러 추적에 사용)
          Sentry.setUser({
            id: profileData.userId,
            email: profileData.user.email ?? undefined,
            username: profileData.user.nickname ?? undefined,
          });
        } catch (error) {
          // 프로필 조회 실패 시 로그인 상태만 설정
          setSocialLogin();

          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              context: 'auth',
              operation: 'fetch-profile-on-login',
            },
          });
        }

        // 초대 코드 기반 그룹 자동 가입
        if (inviteCode) {
          joinGroup(
            {},
            {
              onSuccess: (response) => {
                const groupId = response.data.groupId;
                //const groupName = response.data.group.name;
                if (!groupId) createApiError(response);
                deleteCookie('invite-code');
                toast.success(`그룹에 참여되었습니다!`);
                router.replace(`/group/${groupId}`);
              },
            },
          );
        }

        // 온보딩 체크 (userId별로 저장)
        if (userId) {
          const hasSeenOnboarding = localStorage.getItem(
            `has_seen_onboarding_${userId}`,
          );
          if (hasSeenOnboarding === 'true') {
            router.replace('/'); // 이미 봤다면 홈으로
          } else {
            router.replace('/onboarding'); // 안 봤다면 온보딩으로
          }
        } else {
          // userId를 가져오지 못한 경우 기본적으로 홈으로
          router.replace('/');
        }
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
