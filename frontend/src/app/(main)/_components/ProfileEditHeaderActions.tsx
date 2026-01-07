'use client';

import Back from '@/components/Back';
import { useRouter } from 'next/navigation';
import { useProfileEdit } from '../profile/edit/_components/ProfileEditContext';

export default function ProfileEditHeaderActions() {
  const router = useRouter();
  const { getEditData } = useProfileEdit();

  const handleSave = () => {
    const editData = getEditData();

    // FormData를 사용하여 파일과 데이터를 함께 전송
    const formData = new FormData();
    formData.append('nickname', editData.nickname);
    if (editData.image) {
      formData.append('profileImage', editData.image);
    }

    console.log(
      'formData',
      formData.get('nickname'),
      formData.get('profileImage'),
    );
    // TODO: 서버에 프로필 저장 요청
    router.push('/profile');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md px-5 py-6 flex items-center justify-between border-b transition-colors duration-300 dark:bg-[#121212]/95 dark:border-white/5 bg-white/95 border-gray-100">
      <Back />
      <h2 className="text-sm font-bold dark:text-white text-itta-black">
        프로필 수정
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
