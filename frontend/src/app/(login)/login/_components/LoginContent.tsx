'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useApiPost } from '@/hooks/useApi';
import { GuestInfo } from '@/lib/types/profile';
import { getRedirectUri } from '@/lib/utils/getRedirectUri';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { deleteCookie, getCookie } from '@/lib/utils/cookie';
import { post } from '@/lib/api/api';
import { guestCookieKey } from '@/store/useAuthStore';
import { useJoinGroup } from '@/hooks/useGroupInvite';
import { createApiError } from '@/lib/utils/errorHandler';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';
import { isInAppBrowser } from '@/lib/utils/browserDetect';
import ServiceIntro from './ServiceIntro';

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

const isAndroidPlatform = () =>
  typeof window !== 'undefined' &&
  (
    window as unknown as { Capacitor?: { getPlatform?: () => string } }
  ).Capacitor?.getPlatform?.() === 'android';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_callback: '잘못된 로그인 요청입니다.',
  token_not_found: '인증 토큰을 받지 못했습니다.',
  login_failed: '로그인에 실패했습니다. 다시 시도해주세요.',
};

const REASON_MESSAGES: Record<string, string> = {
  'guest-expired':
    '게스트 유효기간이 만료되었습니다.\n계속 이용하시려면 다시 로그인해주세요.',
  expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
};

export default function LoginContent({
  error,
  callback,
  reason,
  forceAccountSelect = false,
}: {
  error?: string | undefined;
  callback?: string | undefined;
  reason?: string | undefined;
  forceAccountSelect?: boolean;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const inviteCode =
    getCookie('invite-code') ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('invite-code')
      : null) ||
    '';

  const { setGuestInfo, isLoggedIn, guestSessionId } = useAuthStore();
  const { mutateAsync: joinGroup } = useJoinGroup(inviteCode);
  const [isLoading, setIsLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > window.innerHeight * 0.75);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const { mutate: guestLogin, isPending } = useApiPost<GuestInfo>(
    '/api/auth/guest',
    {
      onSuccess: async (response) => {
        const authHeader =
          response.headers?.get('Authorization') ||
          response.headers?.get('authorization');

        const accessToken = authHeader?.replace('Bearer ', '');

        if (response.data && accessToken) {
          setGuestInfo({ ...response.data, guestAccessToken: accessToken });

          // Sentry에 게스트 사용자 정보 설정
          Sentry.setUser({
            id: `guest-${response.data.guestSessionId}`,
            username: 'Guest User',
          });

          // 초대 코드 기반 그룹 자동 가입
          let inviteGroupId: string | null = null;
          if (inviteCode) {
            try {
              const groupResponse = await joinGroup({});
              inviteGroupId = groupResponse.data.groupId;
              if (!inviteGroupId) createApiError(groupResponse);
              deleteCookie('invite-code');
              sessionStorage.removeItem('invite-code');
              toast.success(`그룹에 참여되었습니다!`);
            } catch (error) {
              // 그룹 가입 실패 시에도 로그인은 계속 진행
              toast.error(
                '그룹 가입에 실패했습니다. 나중에 다시 시도해주세요.',
              );
              deleteCookie('invite-code'); // 실패한 초대 코드 제거
              sessionStorage.removeItem('invite-code');

              Sentry.captureException(error, {
                level: 'warning',
                tags: {
                  context: 'invite',
                  operation: 'join-invited-group',
                },
                extra: {
                  inviteCode: inviteCode,
                  loginType: 'guest',
                },
              });
              logger.error('그룹 가입 실패', error);
            }
          }

          // 최종 리디렉션 경로 결정 (우선순위: 초대 그룹 > callback > 홈)
          const redirectPath = inviteGroupId
            ? `/group/${inviteGroupId}`
            : callback || '/';

          // 게스트는 온보딩을 보지 않으므로 바로 리디렉션
          toast.info(
            `게스트 모드는 3일 뒤에 작성하신 데이터가 삭제되니\n소중한 기록을 잃지 않도록 계정을 연동해 주세요.`,
          );
          window.location.href = redirectPath;
        } else {
          // 응답은 성공했지만 데이터나 토큰이 없는 경우
          const error = new Error(
            '게스트 로그인 응답에 필요한 데이터가 없습니다',
          );
          Sentry.captureException(error, {
            level: 'error',
            tags: {
              context: 'auth',
              operation: 'guest-login-invalid-response',
            },
            extra: {
              hasData: !!response.data,
              hasAccessToken: !!accessToken,
            },
          });
          logger.error('게스트 로그인 응답에 필요한 데이터가 없습니다');
          toast.error('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
        }
      },
      onError: (error) => {
        setIsLoading(false);
        Sentry.captureException(error, {
          level: 'error',
          tags: {
            context: 'auth',
            operation: 'guest-login',
          },
        });
        logger.error('게스트 로그인 실패', error);
        toast.error('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
      },
    },
  );

  useEffect(() => {
    if (isLoggedIn) return;
    if (error) {
      const message = ERROR_MESSAGES[error] || '로그인 중 오류가 발생했습니다.';
      toast.error(message);

      // URL에서 error 파라미터 제거
      router.replace('/login');
    }

    if (reason) {
      const message = REASON_MESSAGES[reason] || '다시 로그인해주세요.';
      toast.info(message, { duration: 5000 });

      // URL에서 reason 파라미터 제거
      router.replace('/login');
    }
  }, [router, error, reason, isLoggedIn]);

  // 네이티브 앱에서 OAuth 콜백 처리 (ittda://oauth/callback?code=XXX)
  useEffect(() => {
    if (!isNativePlatform()) return;

    let removeListener: (() => void) | null = null;

    const setup = async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appUrlOpen', async (event) => {
        try {
          const url = new URL(event.url);
          if (url.protocol === 'ittda:' && url.pathname === '/callback') {
            const code = url.searchParams.get('code');
            if (!code) return;
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
            router.replace(`/oauth/callback?code=${encodeURIComponent(code)}`);
          }
        } catch (err) {
          logger.error('appUrlOpen 처리 오류', err);
        }
      });
      removeListener = () => handle.remove();
    };

    setup();
    return () => {
      removeListener?.();
    };
  }, [router]);

  const handleLoginGuest = async () => {
    setIsLoading(true);
    await signOut({ redirect: false });
    const existingSessionId = getCookie(guestCookieKey) || guestSessionId;
    if (existingSessionId) {
      try {
        const response = await post<GuestInfo>(
          '/api/auth/guest/restore',
          { sessionId: existingSessionId },
          { skipAuth: true },
        );
        const authHeader =
          response.headers?.get('Authorization') ||
          response.headers?.get('authorization');
        const accessToken = authHeader?.replace('Bearer ', '');
        if (response.success && response.data && accessToken) {
          setGuestInfo({ ...response.data, guestAccessToken: accessToken });

          // 초대 코드가 있으면 그룹 자동 가입 시도
          let redirectPath = callback || '/';
          if (inviteCode) {
            try {
              const groupResponse = await joinGroup({});
              const inviteGroupId = groupResponse.data.groupId;
              if (!inviteGroupId) createApiError(groupResponse);
              deleteCookie('invite-code');
              sessionStorage.removeItem('invite-code');
              toast.success(`그룹에 참여되었습니다!`);
              redirectPath = `/group/${inviteGroupId}`;
            } catch (error) {
              toast.error(
                '그룹 가입에 실패했습니다. 나중에 다시 시도해주세요.',
              );
              deleteCookie('invite-code');
              sessionStorage.removeItem('invite-code');
              logger.error('게스트 복원 후 그룹 가입 실패', error);
            }
          }

          window.location.href = redirectPath;
          return;
        }
        // restore 실패(세션 만료, 401 등) → 새 게스트 세션으로 진행
        deleteCookie(guestCookieKey);
        toast.info(
          '이전 게스트 데이터가 만료되어 삭제되었어요.\n새 게스트 세션으로 시작할게요.',
          { duration: 5000 },
        );
      } catch {
        // 네트워크 오류 등 restore 자체가 실패한 경우
        setIsLoading(false);
        toast.error('네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
        return;
      }
    }
    guestLogin({});
  };

  const handleSocialLogin =
    (provider: 'google' | 'kakao') =>
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      // 네이티브 앱: SFSafariViewController(iOS)로 OAuth 처리
      if (isNativePlatform()) {
        e.preventDefault();
        if (callback) {
          sessionStorage.setItem('auth_callback', callback);
        }
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({
          url: getRedirectUri({
            provider,
            callback,
            forceAccountSelect,
            mobile: true,
            android: isAndroidPlatform(),
          }),
        });
        return;
      }

      if (isInAppBrowser()) {
        e.preventDefault();
        toast.error(
          '인앱 브라우저에서는 로그인이 제한될 수 있습니다.\n기본 브라우저(Chrome, Safari 등)에서 열어주세요.',
          { duration: 5000 },
        );
        return;
      }

      // callback을 sessionStorage에 저장 (백엔드가 전달하지 않는 경우 대비)
      if (callback) {
        sessionStorage.setItem('auth_callback', callback);
      }
      // 로그인 버튼 누를 때 error 를 담고 있다면 무시되도록 하기
      if (window.location.search.includes('error=')) {
        toast.dismiss();
      }
    };

  return (
    <div
      ref={scrollContainerRef}
      className="relative left-1/2 -ml-[50vw] w-screen h-dvh overflow-y-auto snap-y snap-mandatory flex flex-col bg-white"
    >
      {/* 히어로: 흰 배경(고정, 다크모드 미적용) + 노션처럼 이미지 없이 중앙 정렬 */}
      <div className="relative w-full min-h-dvh shrink-0 snap-start flex flex-col overflow-hidden bg-white">
        {/* 좌상단 워드마크 */}
        <div
          className="relative z-10 px-6 lg:px-12"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }}
        >
          <h1 className="text-xl font-medium tracking-tighter flex items-center text-itta-black">
            잇다
            <span
              className="text-itta-black/50 ml-0.5"
              style={{ fontWeight: 100 }}
            >
              -
            </span>
          </h1>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-12 px-6 lg:px-12 py-10 max-w-6xl mx-auto w-full">
          {/* 텍스트 + 로그인 CTA — 노션처럼 이미지 없이 중앙 정렬된 단순한 히어로 */}
          <div className="flex flex-col items-center text-center max-w-xl">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-itta-point mb-4">
              Connected by Context
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-[44px] font-bold leading-[1.3] mb-3 text-itta-black">
              기억과 맥락을 잇다
            </h2>
            <p className="text-sm md:text-base lg:text-lg leading-relaxed break-keep text-gray-500 max-w-xs lg:max-w-md mb-9">
              사진 한 장이면 날짜와 장소가 자동으로 기록되고, 친구와 함께
              우리만의 기억을 만들어가요.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center flex-wrap justify-center gap-3">
                {/* 구글 로그인 */}
                <Link
                  href={getRedirectUri({
                    provider: 'google',
                    callback,
                    forceAccountSelect,
                  })}
                  onClick={handleSocialLogin('google')}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-[14px] font-semibold text-[#1F1F1F]">
                    Google로 시작하기
                  </span>
                </Link>

                {/* 카카오 로그인 */}
                <Link
                  href={getRedirectUri({
                    provider: 'kakao',
                    callback,
                    forceAccountSelect,
                  })}
                  onClick={handleSocialLogin('kakao')}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#FEE500] shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 shrink-0 fill-[#3C1E1E]"
                  >
                    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.315 6.091l-1.098 4.019c-.066.242.062.483.286.538.074.018.15.016.223-.004l4.744-3.137c.174.005.35.008.53.008 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                  </svg>
                  <span className="text-[14px] font-semibold text-[#3C1E1E]">
                    Kakao로 시작하기
                  </span>
                </Link>
              </div>

              <button
                onClick={handleLoginGuest}
                disabled={isLoading || isPending}
                className="text-[13px] font-medium text-gray-500 transition-opacity hover:opacity-60 active:scale-95 disabled:opacity-30"
              >
                {isLoading || isPending ? '로그인 중...' : '가입 없이 시작하기'}
              </button>
            </div>
          </div>
        </div>

        {/* 아래에 기능 소개가 더 있다는 걸 알려주는 스크롤 유도(마우스 스크롤 아이콘) */}
        <div className="relative z-10 flex flex-col items-center gap-2 pb-4">
          <span className="text-[11px] text-gray-400">
            스크롤해서 더 알아보기
          </span>
          <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex justify-center pt-1.5">
            <motion.div
              className="w-1 h-2 rounded-full bg-gray-400"
              animate={
                shouldReduceMotion
                  ? { y: 0, opacity: 1 }
                  : { y: [0, 12, 0], opacity: [1, 1, 0] }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              }
            />
          </div>
        </div>

        <div
          className="relative z-10 flex justify-center pb-6"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)',
          }}
        >
          <Link
            href="/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gray-400 hover:underline transition-all"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>

      {/* 기능 소개: 스크롤해야 보이는 영역 */}
      <ServiceIntro />

      <div className="w-full bg-white flex flex-col items-center gap-5 py-10 px-6 shrink-0 snap-start">
        {/* 여기까지 내려온 사람이 로그인하려고 다시 맨 위로 스크롤할 필요 없도록 */}
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full bg-itta-black text-white text-sm font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
        >
          로그인 하기
          <ArrowUp className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-gray-400">
          © 2026 잇다-. ALL RIGHTS RESERVED.
        </p>
      </div>

      <div
        aria-hidden
        style={{
          height: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      />

      {/* 아래로 스크롤한 상태에서만 노출되는 맨 위로 이동 버튼 */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="맨 위로 이동"
          className="fixed right-4 md:right-6 bottom-6 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-itta-black text-white shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
          }}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
