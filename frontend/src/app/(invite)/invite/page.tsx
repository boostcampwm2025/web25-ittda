'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Check, UserRound } from 'lucide-react';
import { setCookie } from '@/lib/utils/cookie';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { useGetInviteInfo, useJoinGroup } from '@/hooks/useGroupInvite';
import { createApiError } from '@/lib/utils/errorHandler';
import { handleInviteError } from '../_utils/handleInviteError';
import { handleLogout } from '@/lib/api/auth';
import { useQuery } from '@tanstack/react-query';
import { userProfileOptions } from '@/lib/api/profile';
import Image from 'next/image';
import AssetImage from '@/components/AssetImage';
import { randomBaseImage } from '@/lib/image';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자',
  EDITOR: '편집자',
  VIEWER: '뷰어',
};

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, userType } = useAuthStore();
  const inviteCode = searchParams.get('inviteCode');

  const {
    data: inviteInfo,
    isLoading,
    isError: isInviteError,
  } = useGetInviteInfo(inviteCode || '');
  const { data: profile } = useQuery({
    ...userProfileOptions(),
    enabled: isLoggedIn && userType === 'social',
  });
  const { mutate: joinGroup } = useJoinGroup(inviteCode || '');

  const currentState = !isLoggedIn
    ? 'anonymous'
    : userType === 'guest'
      ? 'guest'
      : 'social';
  const nickname = profile?.user?.nickname ?? '현재 계정';
  const groupName = inviteInfo?.group?.name ?? '그룹';
  const memberCount = inviteInfo?.memberCount;
  const coverMediaId = inviteInfo?.group?.coverMediaId;
  const fallbackImageSrc = inviteInfo?.group?.id
    ? randomBaseImage(inviteInfo.group.id)
    : null;
  const permission = inviteInfo?.permission;
  const permissionLabel = permission ? ROLE_LABEL[permission] : null;

  const buttonLabel = {
    social: `${nickname}으로 참여하기`,
    guest: '게스트 계정으로 참여하기',
    anonymous: '로그인하고 참여하기',
  }[currentState];

  const descriptionLabel = {
    social: '현재 로그인된 계정으로 즉시 그룹에 합류합니다.',
    guest:
      '현재 브라우저에 저장된 게스트 정보로 참여합니다.\n별도의 아이디 없이 이 기기에서 3일간 정보가 유지됩니다.',
    anonymous: '로그인 또는 가입 후 바로 그룹에 가입됩니다.',
  }[currentState];

  const handleAccept = async (forceLogin = false) => {
    if (!inviteCode) return;

    if (isLoggedIn && !forceLogin) {
      joinGroup(
        {},
        {
          onSuccess: (response) => {
            const groupId = response.data.groupId;
            if (!groupId) createApiError(response);
            router.replace(`/group/${groupId}`);
            setTimeout(() => toast.success('그룹에 참여되었습니다!'), 500);
          },
          onError: (error) => {
            const path = handleInviteError(error);
            if (path) router.replace(path);
          },
        },
      );
      return;
    }

    setCookie('invite-code', inviteCode, { days: 1 });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('invite-code', inviteCode);
    }

    if (forceLogin && isLoggedIn) {
      toast.info('로그인 후 자동으로 그룹에 가입됩니다.');
      await handleLogout();
      return;
    }

    toast.info('로그인 후 자동으로 그룹에 가입됩니다.');
    router.push('/login');
  };

  return (
    <div className="bg-[#F9F9F9] dark:bg-[#121212] transition-colors duration-300 sm:min-h-dvh sm:flex sm:items-center sm:justify-center sm:p-8">
      <div className="flex flex-col w-full h-dvh sm:h-auto sm:max-w-sm sm:shadow-xl sm:border sm:border-gray-100 sm:dark:border-gray-800 overflow-hidden bg-white dark:bg-[#1e1e1e] sm:rounded-3xl">
        {/* 상단 그룹 이미지 배너 — safe-area-top 포함해 노치/상태바 뒤까지 채움 */}
        <div
          className="relative w-full shrink-0 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
          style={{ height: 'calc(15rem + env(safe-area-inset-top, 0px))' }}
        >
          {isLoading ? (
            <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
          ) : coverMediaId ? (
            <AssetImage
              assetId={coverMediaId}
              alt={groupName}
              fill
              className="object-cover"
              priorityLoad
              fallback={
                fallbackImageSrc ? (
                  <Image
                    src={fallbackImageSrc}
                    alt={groupName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-itta-point/10">
                    <Users className="text-itta-point/40 w-16 h-16" />
                  </div>
                )
              }
            />
          ) : fallbackImageSrc ? (
            <Image
              src={fallbackImageSrc}
              alt={groupName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="text-gray-300 dark:text-gray-600 w-16 h-16" />
            </div>
          )}
          {/* 하단 페이드 오버레이 */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-white dark:from-[#1e1e1e] to-transparent" />
        </div>

        {/* 그룹 정보 */}
        <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center gap-3">
          {isLoading ? (
            <>
              <div className="h-7 w-36 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
              <div className="h-5 w-40 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
              <div className="h-4 w-48 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
            </>
          ) : isInviteError ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-base font-semibold text-gray-400 dark:text-gray-500">
                유효하지 않은 초대 링크
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                만료되었거나 존재하지 않는 초대 링크입니다.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {groupName}
              </h1>

              {/* 메타 정보 chips */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {memberCount !== undefined && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-full">
                    <UserRound className="w-3 h-3" />
                    {memberCount}명
                  </span>
                )}
                {permissionLabel && (
                  <span className="inline-flex items-center text-xs font-medium text-itta-point bg-itta-point/10 px-2.5 py-1 rounded-full">
                    {permissionLabel}로 가입
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                회원님을 그룹에 초대했습니다.
              </p>
            </>
          )}
        </div>

        {/* 하단 액션 영역 — safe-area-bottom(홈 인디케이터) 포함 */}
        <div
          className="mt-auto shrink-0 flex flex-col gap-2 px-6 pt-2 sm:pb-6"
          style={{
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed whitespace-pre-line">
            {descriptionLabel}
          </p>

          <button
            onClick={() => handleAccept(false)}
            disabled={isInviteError}
            className="w-full h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            <Check className="w-4 h-4" />
            {buttonLabel}
          </button>

          {currentState !== 'anonymous' && (
            <button
              onClick={() => handleAccept(true)}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-center transition-colors py-2"
            >
              다른 계정으로 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
