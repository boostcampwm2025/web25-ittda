'use client';

import Back from '@/components/Back';
import { useRouter } from 'next/navigation';
import { useProfileEdit } from '../app/(main)/profile/edit/_components/ProfileEditContext';
import { Loader2 } from 'lucide-react';

interface ProfileEditHeaderActionsProps {
  title?: string;
  onSave: (data: { nickname: string; image: File | null }) => void;
  redirectPath?: string;
  isPending: boolean;
}

export default function ProfileEditHeaderActions({
  title = '프로필 수정',
  onSave,
  redirectPath,
  isPending = false,
}: ProfileEditHeaderActionsProps) {
  const router = useRouter();
  const { getEditData } = useProfileEdit();

  const handleSave = () => {
    const editData = getEditData();

    onSave(editData);

    if (redirectPath) {
      router.push(redirectPath);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/95 bg-white/95">
      <Back />
      <h2 className="text-sm font-bold dark:text-white text-itta-black">
        {title}
      </h2>
      <button
        onClick={handleSave}
        className="cursor-pointer font-bold text-sm active:scale-95 transition-all"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
      </button>
    </header>
  );
}
