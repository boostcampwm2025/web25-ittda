'use client';

import Back from '@/components/Back';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileAllTagsHeaderActions() {
  const router = useRouter();

  return (
    <header className="px-5 py-6 flex items-center justify-between transition-colors dark:bg-[#121212] bg-white">
      <Back />
      <h2 className="text-[16px] font-medium dark:text-white text-itta-black">
        태그
      </h2>
      <button
        onClick={() => router.push('/search')}
        className="p-1 cursor-pointer"
      >
        <Search className="w-5 h-5 dark:text-white text-gray-400" />
      </button>
    </header>
  );
}
