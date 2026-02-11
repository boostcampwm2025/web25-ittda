'use client';

import Back from '@/components/Back';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileAllEmotionsHeaderActions() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 max-w-4xl w-full mx-auto px-4 py-3 sm:px-5 sm:py-6 flex items-center justify-between dark:bg-[#121212] bg-white backdrop-blur-xl transition-all duration-500">
      <Back />
      <h2 className="text-sm sm:text-base font-medium dark:text-white text-itta-black">
        감정
      </h2>
      <button
        onClick={() => router.push('/search')}
        className="p-1 cursor-pointer"
      >
        <Search className="w-4 h-4 sm:w-5 sm:h-5 dark:text-white text-gray-400" />
      </button>
    </header>
  );
}
