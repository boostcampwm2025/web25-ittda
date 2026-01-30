'use client';

import { userProfileOptions } from '@/lib/api/profile';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AssetImage from './AssetImage';

export default function Header() {
  const router = useRouter();
  const { userId, setLogin } = useAuthStore();

  const { data: userProfile } = useQuery(userProfileOptions());

  if (userProfile && !userId) {
    setLogin({
      id: userProfile.userId,
      email: userProfile.user.email ?? 'example.com',
      nickname: userProfile.user.nickname ?? 'Anonymous',
      profileImageId: userProfile.user.profileImage?.url ?? null,
      createdAt: userProfile.user.createdAt,
    });
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 max-w-4xl w-full px-6 py-4 mx-auto',
        'flex items-center justify-between',
        'backdrop-blur-xl transition-all duration-500',
        'bg-white/80',
        'dark:bg-[#121212]/80',
      )}
    >
      <button
        onClick={() => router.push('/')}
        className="flex flex-col cursor-pointer group"
      >
        <h1
          className={cn(
            'text-xl font-bold tracking-tight transition-all active:scale-95',
            'text-[#222222] dark:text-white',
          )}
        >
          잇다-
        </h1>
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/search')}
          className={cn(
            'cursor-pointer p-2.5 rounded-2xl transition-all active:scale-90',
            'hover:bg-gray-50 text-gray-500',
            'dark:hover:bg-white/5 dark:text-gray-400',
          )}
        >
          <Search className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <button
          onClick={() => router.push('/profile')}
          className={cn(
            'cursor-pointer w-10 h-10 rounded-full overflow-hidden border transition-all active:scale-90',
            'border-gray-100 shadow-sm',
            'dark:border-white/10 dark:shadow-none',
          )}
        >
          {userProfile?.user.profileImageId ? (
            <AssetImage
              width={50}
              height={50}
              assetId={userProfile.user.profileImageId}
              alt="유저 프로필"
            />
          ) : (
            <Image
              width={30}
              height={30}
              src={'/profile_base.png'}
              alt="프로필"
              className="w-full h-full object-cover"
            />
          )}
        </button>
      </div>
    </header>
  );
}
