'use client';

import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  AlertCircle,
  ChevronRight,
  Download,
  LogIn,
  LogOut,
  Moon,
  Sun,
  UserX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import PWAInstallModal from '@/components/PWAInstallModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useApiDelete, useApiPost } from '@/hooks/useApi';
import { toast } from 'sonner';

export default function Setting() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { guestSessionId, userId } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { isInstalled, promptInstall, isIOS, isSafari, isMacOS } =
    usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  const { mutate: logout } = useApiPost('/api/auth/logout', {
    onSuccess: () => {
      toast.success('로그아웃 되었습니다. 잠시후 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    },
  });

  const { mutate: withdrawal } = useApiDelete('/api/me', {
    onSuccess: () => {
      toast.success('탈퇴되었습니다. 잠시후 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    },
  });

  useEffect(() => {
    // React 19의 cascading renders 에러 방지를 위한 지연 처리
    const raId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raId);
  }, []);

  // Hydration 불일치를 방지하기 위해 마운트되기 전에는 아무것도 렌더링하지 않음
  if (!mounted) {
    return null;
  }

  const handleWithdrawal = () => {
    withdrawal({});
  };

  const handleLogout = () => {
    logout({});
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const toggleDarkMode = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const handleInstallClick = async () => {
    // Chrome/Edge 등에서 기본 프롬프트 지원하는 경우
    const outcome = await promptInstall();

    if (outcome === null) {
      // 프롬프트를 지원하지 않는 브라우저 (Safari, Vivaldi 등)
      // 커스텀 안내 모달 표시
      setShowInstructions(true);
    }
  };

  const currentTheme = resolvedTheme;

  return (
    <>
      {/* PWA 설치 안내 모달 */}
      <PWAInstallModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        isIOS={isIOS}
        isSafari={isSafari}
        isMacOS={isMacOS}
      />

      <div className="rounded-2xl p-6 shadow-xs border space-y-5 transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg transition-colors dark:bg-purple-500/10 dark:text-purple-400 bg-yellow-50 text-yellow-500">
              {currentTheme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </div>
            <span className="text-sm font-bold dark:text-gray-200 text-itta-black">
              다크 모드
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={cn(
              'cursor-pointer w-11 h-6 rounded-full relative transition-all duration-300',
              !mounted
                ? 'bg-gray-200'
                : currentTheme === 'dark'
                  ? 'bg-purple-500'
                  : 'bg-gray-200',
            )}
          >
            <div
              className={cn(
                'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out',
                mounted && currentTheme === 'dark' && 'translate-x-5',
              )}
            />
          </button>
        </div>

        <div className="pt-2 border-t dark:border-white/5 border-gray-50">
          <button className="w-full flex items-center justify-between py-2 group">
            <span className="text-sm font-bold dark:text-gray-400 text-itta-black">
              버전 정보
            </span>
            <span className="text-xs font-bold text-gray-300 group-hover:text-gray-400">
              v1.0.0
            </span>
          </button>
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="cursor-pointer w-full flex items-center justify-between py-2 group"
            >
              <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                <Download className="w-4 h-4 text-gray-400" />앱 설치하기
              </span>
              <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400" />
            </button>
          )}
          {guestSessionId && (
            <button
              onClick={handleLogin}
              className="cursor-pointer w-full flex items-center justify-between py-2 group"
            >
              <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-gray-400" />
                로그인
              </span>
              <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400" />
            </button>
          )}
          {!guestSessionId && userId && (
            <button
              onClick={handleLogout}
              className="cursor-pointer w-full flex items-center justify-between py-2 group"
            >
              <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-gray-400" />
                로그아웃
              </span>
              <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400" />
            </button>
          )}
          <Drawer>
            <DrawerTrigger className="cursor-pointer w-full flex items-center justify-between py-2 group text-red-400">
              <span className="text-sm font-bold flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-400" />
                탈퇴하기
              </span>
              <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400" />
            </DrawerTrigger>
            <DrawerContent className="px-8 pt-4 pb-12">
              <DrawerHeader>
                <div className="flex flex-col items-center text-center space-y-4 mb-10">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                      정말 탈퇴하시겠습니까?
                    </DrawerTitle>
                    <p className="text-sm text-gray-400 font-medium">
                      기록된 모든 추억이 사라집니다.
                    </p>
                  </div>
                </div>
              </DrawerHeader>

              <div className="flex gap-4">
                <DrawerClose className="cursor-pointer flex-1 py-4 rounded-2xl text-sm font-bold transition-all dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-500 active:bg-gray-200">
                  취소
                </DrawerClose>
                <DrawerClose
                  onClick={handleWithdrawal}
                  className="cursor-pointer flex-2 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
                >
                  탈퇴하기
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </>
  );
}
