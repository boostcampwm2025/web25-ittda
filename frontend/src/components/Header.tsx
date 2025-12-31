'use client';

import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full px-5 py-4',
        'flex items-center justify-between',
        'backdrop-blur-xl transition-all duration-500 border-b',
        'bg-white/80 border-gray-100/50',
        'dark:bg-[#121212]/80 dark:border-white/5',
      )}
    >
      <div
        onClick={() => router.push('/')}
        className="flex flex-col cursor-pointer group"
      >
        <h1
          className={cn(
            'text-xl font-semibold tracking-tight transition-all active:scale-95',
            'text-[#222222] dark:text-white',
          )}
        >
          잇다-
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/search')}
          className={cn(
            'p-2.5 rounded-2xl transition-all active:scale-90',
            'hover:bg-gray-50 text-gray-500',
            'dark:hover:bg-white/5 dark:text-gray-400',
          )}
        >
          <Search className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <button
          onClick={() => router.push('/profile')}
          className={cn(
            'w-10 h-10 rounded-full overflow-hidden border transition-all active:scale-90',
            'border-gray-100 shadow-sm',
            'dark:border-white/10 dark:shadow-none',
          )}
        >
          <Image
            src="/profile-ex.jpeg"
            alt="프로필"
            className="w-full h-full object-cover"
            width={30}
            height={30}
          />
        </button>
      </div>
    </header>
  );
}
