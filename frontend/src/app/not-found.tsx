'use client';

import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex-1 pb-20 flex flex-col items-center justify-center px-8 text-center transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center animate-bounce-subtle dark:bg-white/5 bg-gray-50">
          <SearchX className="w-12 h-12 dark:text-gray-500 text-gray-300" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
          404
        </div>
      </div>

      <div className="space-y-2 mb-12">
        <h2 className="text-2xl font-black tracking-tight dark:text-white text-[#222222]">
          기억의 연결이 끊겼어요
        </h2>
        <p className="text-sm font-medium leading-relaxed dark:text-gray-500 text-gray-400">
          요청하신 페이지를 찾을 수 없습니다.
          <br />
          주소가 변경되었거나 삭제되었을 수 있어요.
        </p>
      </div>

      <div className="flex flex-col w-full max-w-60 gap-3">
        <button
          onClick={() => router.push('/')}
          className="cursor-pointer w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-xl transition-all active:scale-95 dark:bg-white dark:text-[#121212] bg-itta-black text-white"
        >
          <Home className="w-4 h-4" />
          홈으로 돌아가기
        </button>
        <button
          onClick={() => router.back()}
          className="cursor-pointer w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border transition-all active:scale-95 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 bg-white border-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-4 h-4" />
          이전 페이지로
        </button>
      </div>

      <div className="mt-20 opacity-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <div className="w-12 h-px bg-linear-to-r from-[#10B981] to-transparent" />
          <span className="text-[10px] font-black tracking-widest uppercase italic">
            Connection Lost
          </span>
        </div>
      </div>
    </div>
  );
}
