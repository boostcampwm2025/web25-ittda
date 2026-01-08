'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();

  return (
    <div className="rounded-2xl p-6 shadow-sm border flex items-center gap-5 transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100">
      <div className="w-20 h-20 rounded-full border-4 overflow-hidden shadow-sm dark:border-[#121212] border-[#F9F9F9]">
        <Image
          width={100}
          height={100}
          src="/profile-ex.jpeg"
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-black mb-1 dark:text-white text-itta-black">
          필릭스
        </h3>
        <p className="text-xs text-gray-400 font-medium mb-3">felix@dlog.me</p>
        <button
          onClick={() => router.push('/profile/edit')}
          className="cursor-pointer px-4 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-all dark:bg-white/5 dark:text-gray-300 dark:border-white/10 bg-gray-50 text-gray-500 border-gray-100"
        >
          프로필 수정
        </button>
      </div>
    </div>
  );
}
