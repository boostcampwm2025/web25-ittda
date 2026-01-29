'use client';

import ProfileEditProvider from '@/app/(main)/profile/edit/_components/ProfileEditContext';
import ProfileEditHeaderActions from '@/components/ProfileEditHeaderActions';
import ProfileInfo from '@/components/ProfileInfo';
import { useApiPatch } from '@/hooks/useApi';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { UpdateGroupMeParams } from '@/lib/types/groupResponse';

import { BaseUser } from '@/lib/types/profile';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

interface GroupProfileEditClientProps {
  groupId: string;
  groupProfile: Omit<BaseUser, 'email'>;
}

export default function GroupProfileEditClient({
  groupId,
  groupProfile,
}: GroupProfileEditClientProps) {
  const { mutateAsync: updateProfile } = useApiPatch<UpdateGroupMeParams>(
    `/api/groups/${groupId}/members/me`,
  );
  const { userId } = useAuthStore();

  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const { uploadMultipleMedia } = useMediaUpload();

  const handleSave = async (data: { nickname: string; image: File | null }) => {
    setIsPending(true);
    try {
      let finalMediaId = groupProfile.profileImageId;

      if (data.image) {
        finalMediaId = (await uploadMultipleMedia([data.image]))[0];
      }

      await updateProfile({
        nicknameInGroup: data.nickname,
        profileMediaId: finalMediaId || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'me'] });
      toast.success('프로필 정보가 수정되었습니다.');
    } catch (error) {
      console.error('그룹 내 내정보 수정 실패', error);
    } finally {
      setIsPending(false);
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
          isPending={isPending}
        />
        <div className="flex p-6 flex-col gap-10">
          <ProfileInfo profileImage={currentImage} showEmail={false} />
        </div>
      </div>
    </ProfileEditProvider>
  );
}
