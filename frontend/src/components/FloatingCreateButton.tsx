'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface FloatingCreateButtonProps {
  href?: string;
}

export default function FloatingCreateButton({
  href = '/create/diary-travel',
}: FloatingCreateButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={cn(
        // 위치: 데스크탑에서는 오른쪽 아래, 모바일에서는 바텀 네비 위로 살짝 올림
        'fixed right-6 md:right-8 bottom-24 md:bottom-8 z-30 flex items-center justify-center cursor-pointer',
        // 크기: 50 x 50 + 입체감을 위한 그림자
        'w-[50px] h-[50px] rounded-full bg-itta-black text-white',
        // PerformanceCard와 동일한 그림자 강도 사용
        'shadow-sm hover:shadow-xl transition-all duration-300',
        'hover:scale-105 active:scale-95',
      )}
      aria-label="새 일기/여행 기록 작성"
    >
      <Plus className="w-5 h-5" />
    </button>
  );
}
