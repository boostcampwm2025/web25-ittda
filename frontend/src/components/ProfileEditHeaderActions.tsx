'use client';

import Back from '@/components/Back';
import { useRouter } from 'next/navigation';
import { useProfileEdit } from '../app/(main)/profile/edit/_components/ProfileEditContext';

interface ProfileEditHeaderActionsProps {
  title?: string;
  onSave?: (data: { nickname: string; image: File | null }) => void;
  redirectPath?: string;
}

export default function ProfileEditHeaderActions({
  title = '프로필 수정',
  onSave,
  redirectPath,
}: ProfileEditHeaderActionsProps) {
  const router = useRouter();
  const { getEditData } = useProfileEdit();

  const handleSave = () => {
    const editData = getEditData();

    if (onSave) {
      onSave(editData);
    } else {
      // FormData를 사용하여 파일과 데이터를 함께 전송
      const formData = new FormData();
      formData.append('nickname', editData.nickname);
      if (editData.image) {
        formData.append('profileImage', editData.image);
      }
      // TODO: 서버에 프로필 저장 요청
    }

    if (redirectPath) {
      router.push(redirectPath);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md py-6 flex items-center justify-between border-b transition-colors duration-300 dark:bg-[#121212]/95 dark:border-white/5 bg-white/95 border-gray-100">
      <Back />
      <h2 className="text-sm font-bold dark:text-white text-itta-black">
        {title}
      </h2>
      <button
        onClick={handleSave}
        className="cursor-pointer font-bold text-sm active:scale-95 transition-all"
      >
        저장
      </button>
    </header>
  );
}
