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
import { logger } from '@/lib/utils/logger';

interface OAuthCallbackContentProps {
  code: string | undefined;
  error: string | undefined;
  callback?: string | undefined;
}

export default function OAuthCallbackContent({
  code,
  error,
  callback,
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
      // callback이 URL에 없으면 sessionStorage에서 가져오기
      const finalCallback =
        callback ||
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('auth_callback')
          : null) ||
        undefined;
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
        let inviteGroupId: string | null = null;
        if (inviteCode) {
          try {
            const response = await joinGroup({});
            inviteGroupId = response.data.groupId;
            if (!inviteGroupId) createApiError(response);
            deleteCookie('invite-code');
            toast.success(`그룹에 참여되었습니다!`);
          } catch (error) {
            // 그룹 가입 실패 시에도 로그인은 계속 진행
            toast.error('그룹 가입에 실패했습니다. 나중에 다시 시도해주세요.');
            deleteCookie('invite-code'); // 실패한 초대 코드 제거

            Sentry.captureException(error, {
              level: 'warning',
              tags: {
                context: 'invite',
                operation: 'join-invited-group',
              },
              extra: {
                inviteCode: inviteCode,
                loginType: 'social',
              },
            });
            logger.error('그룹 가입 실패', error);
          }
        }

        // sessionStorage 정리
        if (finalCallback) {
          sessionStorage.removeItem('auth_callback');
        }

        // 최종 리디렉션 경로 결정 (우선순위: 초대 그룹 > callback > 홈)
        const redirectPath = inviteGroupId
          ? `/group/${inviteGroupId}`
          : finalCallback || '/';

        // 온보딩 체크 (userId별로 저장)
        if (userId) {
          const hasSeenOnboarding = localStorage.getItem(
            `has_seen_onboarding_${userId}`,
          );
          if (hasSeenOnboarding === 'true') {
            router.replace(redirectPath);
          } else {
            // 온보딩을 안 본 경우 온보딩으로 (리디렉션 경로를 callback으로 전달)
            router.replace(
              `/onboarding?callback=${encodeURIComponent(redirectPath)}`,
            );
          }
        } else {
          // userId를 가져오지 못한 경우에도 기본적으로 최종 경로로 이동
          router.replace(redirectPath);
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
