'use client';

import ProfileEditProvider from '@/app/(main)/profile/edit/_components/ProfileEditContext';
import ProfileEditHeaderActions from '@/components/ProfileEditHeaderActions';
import ProfileInfo from '@/components/ProfileInfo';
import { useUpdateGroupProfile } from '@/hooks/useUserGroupSetting';

import { BaseUser } from '@/lib/types/profile';
import { useAuthStore } from '@/store/useAuthStore';

interface GroupProfileEditClientProps {
  groupId: string;
  groupProfile: Omit<BaseUser, 'email'>;
}

export default function GroupProfileEditClient({
  groupId,
  groupProfile,
}: GroupProfileEditClientProps) {
  const { updateProfile } = useUpdateGroupProfile(groupId);
  const { userId } = useAuthStore();

  const handleSave = async (data: { nickname: string; image: File | null }) => {
    try {
      const mediaId = 'mediaId';

      if (data.image) {
        // TODO: 실제 이미지 업로드 로직이 필요할 경우 여기에 추가
      }

      updateProfile({
        groupId: groupId,
        userId: userId || 'userId',
        nicknameInGroup: data.nickname,
        profileMediaId: mediaId || undefined,
      });
    } catch (error) {
      console.error('오류', error);
    }
  };

  const currentNickname = groupProfile?.nickname || '';
  const currentImage = groupProfile?.profileImageId || '';

  return (
    <ProfileEditProvider
      initialNickname={currentNickname}
      initialImage={currentImage}
    >
      <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
        <ProfileEditHeaderActions
          title="그룹 프로필 수정"
          onSave={handleSave}
        />
        <div className="flex p-6 flex-col gap-10">
          <ProfileInfo profileImage={currentImage} showEmail={false} />
        </div>
      </div>
    </ProfileEditProvider>
  );
}
