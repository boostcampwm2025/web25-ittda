'use client';

import ProfileEditProvider from '@/app/(main)/profile/edit/_components/ProfileEditContext';
import ProfileEditHeaderActions from '@/components/ProfileEditHeaderActions';
import ProfileInfo from '@/components/ProfileInfo';
import { Profile } from '@/lib/types/profile';
import { useRouter } from 'next/navigation';

interface GroupProfileEditClientProps {
  groupId: string;
  groupProfile: Omit<Profile, 'email'>;
}

export default function GroupProfileEditClient({
  groupId,
  groupProfile,
}: GroupProfileEditClientProps) {
  const router = useRouter();

  const handleSave = (data: { nickname: string; image: File | null }) => {
    // FormData를 사용하여 파일과 데이터를 함께 전송
    const formData = new FormData();
    formData.append('nickname', data.nickname);
    if (data.image) {
      formData.append('profileImage', data.image);
    }

    // TODO: 그룹 프로필 저장 API 호출
    // await updateGroupProfile(groupId, formData);

    router.push(`/group/${groupId}/edit`);
  };

  return (
    <ProfileEditProvider
      initialNickname={groupProfile.nickname}
      initialImage={groupProfile.image}
    >
      <ProfileEditHeaderActions title="그룹 프로필 수정" onSave={handleSave} />
      <div className="p-8 flex flex-col gap-10 pb-32">
        <ProfileInfo profileImage={groupProfile.image} showEmail={false} />
      </div>
    </ProfileEditProvider>
  );
}
