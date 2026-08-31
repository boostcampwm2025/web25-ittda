'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackProps {
  size?: number;
  className?: string;
  onClick?: VoidFunction;
  fallback?: string;
}

export default function Back({ size, className, onClick, fallback }: BackProps) {
  const router = useRouter();

  const handleBack = () => {
    const navigate = () => {
      if (
        typeof window !== 'undefined' &&
        window.history.length <= 1 &&
        fallback
      ) {
        router.replace(fallback);
      } else {
        router.back();
      }
      onClick?.();
    };

    if (typeof window === 'undefined') {
      navigate();
      return;
    }

    // Drawer를 열고 닫으면 현재 페이지와 동일한 URL의 placeholder history entry가
    // 남는다(components/ui/drawer.tsx). 이를 먼저 소비하지 않으면 첫 클릭이
    // 이 entry만 제거하고 화면은 그대로여서 "한 번 더 눌러야 뒤로 가는" 것처럼 보인다.
    const consumeDrawerPlaceholders = () => {
      const state = window.history.state as
        | { __drawerId?: string; __drawerClosed?: boolean }
        | null;

      if (state?.__drawerId || state?.__drawerClosed) {
        const handlePop = () => {
          window.removeEventListener('popstate', handlePop);
          consumeDrawerPlaceholders();
        };
        window.addEventListener('popstate', handlePop);
        window.history.go(-1);
        return;
      }

      navigate();
    };

    consumeDrawerPlaceholders();
  };

  return (
    <button
      onClick={handleBack}
      className={cn('cursor-pointer active:scale-80 transition-all', className)}
    >
      <ArrowLeft className="dark:text-white text-itta-black" size={size} />
    </button>
  );
}
