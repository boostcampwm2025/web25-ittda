'use client';

import { useQuery } from '@tanstack/react-query';
import { userProfileOptions } from '@/lib/api/profile';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AssetImage from '@/components/AssetImage';

export default function Profile() {
  const router = useRouter();

  const {
    data: userProfile,
    isLoading,
    isError,
  } = useQuery(userProfileOptions());

  if (isLoading) {
    return (
      <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border flex items-center gap-3 sm:gap-5 transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100 animate-pulse">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="h-5 sm:h-5 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2.5 sm:mb-3" />
          <div className="h-5.5 sm:h-7 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !userProfile) {
    return (
      <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border flex items-center justify-center transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          프로필을 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border flex items-center gap-3 sm:gap-5 transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100">
      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 overflow-hidden shadow-sm dark:border-[#121212] border-[#F9F9F9]">
        {userProfile.user.profileImageId ? (
          <AssetImage
            width={72}
            height={72}
            className="w-full h-full object-cover"
            assetId={userProfile.user.profileImageId}
            alt="유저 프로필"
          />
        ) : (
          <Image
            width={72}
            height={72}
            src={'/profile_base.png'}
            alt="유저 프로필"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-sm sm:text-base font-semibold mb-1 dark:text-white text-itta-black">
          {userProfile.user?.nickname}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-400 font-medium mb-2 sm:mb-3">
          {userProfile.user?.email}
        </p>
        <button
          onClick={() => router.push('/profile/edit')}
          className="cursor-pointer px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold border active:scale-95 transition-all dark:bg-white/5 dark:text-gray-300 dark:border-white/10 bg-gray-50 text-gray-500 border-gray-100"
        >
          프로필 수정
        </button>
      </div>
    </div>
  );
}
