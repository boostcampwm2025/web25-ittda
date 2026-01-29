'use client';

import ProfileEditProvider from './ProfileEditContext';
import ProfileEditHeaderActions from '@/components/ProfileEditHeaderActions';
import ProfileInfo from '@/components/ProfileInfo';
import { useQuery } from '@tanstack/react-query';
import { userProfileOptions } from '@/lib/api/profile';

export default function ProfileEditClient() {
  const { data: profile } = useQuery(userProfileOptions());
  return (
    <ProfileEditProvider
      initialNickname={profile?.user.nickname || 'anonymous'}
      initialImage={profile?.user.profileImageId || '/profile-ex.jpeg'}
      email={profile?.user.email || 'example.com'}
    >
      <ProfileEditHeaderActions redirectPath="/profile" />
      <div className="p-8 flex flex-col gap-10 pb-32">
        <ProfileInfo
          profileImage={profile?.user.profileImageId || '/profile-ex.jpeg'}
          showEmail={true}
        />
      </div>
    </ProfileEditProvider>
  );
}
