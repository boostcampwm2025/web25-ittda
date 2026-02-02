'use client';

import ProfileEditProvider from './ProfileEditContext';
import ProfileEditHeaderActions from '@/components/ProfileEditHeaderActions';
import ProfileInfo from '@/components/ProfileInfo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userProfileOptions } from '@/lib/api/profile';
import { useState } from 'react';
import { useApiPatch } from '@/hooks/useApi';
import { UserProfileResponse } from '@/lib/types/profileResponse';
import { toast } from 'sonner';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import * as Sentry from '@sentry/nextjs';

export default function ProfileEditClient() {
  const { data: profile } = useQuery(userProfileOptions());
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const { mutateAsync: updateUserProfile } =
    useApiPatch<UserProfileResponse>('/api/me');
  const { uploadMultipleMedia } = useMediaUpload();

  const handleSave = async (data: { nickname: string; image: File | null }) => {
    setIsPending(true);
    try {
      let finalMediaId = profile?.user.profileImageId;

      if (data.image) {
        finalMediaId = (await uploadMultipleMedia([data.image]))[0];
      }

      const response = await updateUserProfile({
        nickname: data.nickname,
        profileImageId: finalMediaId,
      });

      queryClient.setQueryData(['profile', 'me'], response.data);
      toast.success('프로필 정보가 수정되었습니다.');
    } catch (error) {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'profile',
          operation: 'update-profile',
        },
        extra: {
          nickname: data.nickname,
        },
      });
      console.error('내정보 수정 실패', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <ProfileEditProvider
      initialNickname={profile?.user.nickname || 'anonymous'}
      initialImage={profile?.user.profileImageId || '/profile_base.png'}
      email={profile?.user.email || 'example.com'}
    >
      <ProfileEditHeaderActions onSave={handleSave} isPending={isPending} />
      <div className="p-8 flex flex-col gap-10 pb-32">
        <ProfileInfo
          profileImage={profile?.user.profileImageId ?? null}
          showEmail={true}
        />
      </div>
    </ProfileEditProvider>
  );
}
