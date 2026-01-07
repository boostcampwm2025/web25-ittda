'use client';

import { Profile } from '@/lib/types/profile';
import ProfileEditProvider from './ProfileEditContext';
import ProfileEditHeaderActions from '@/app/(main)/_components/ProfileEditHeaderActions';
import ProfileInfo from '@/app/(main)/_components/ProfileInfo';

interface ProfileEditClientProps {
  profile: Profile;
}

export default function ProfileEditClient({ profile }: ProfileEditClientProps) {
  return (
    <ProfileEditProvider
      initialNickname={profile.nickname}
      initialImage={profile.image}
    >
      <ProfileEditHeaderActions />
      <div className="p-8 flex flex-col gap-10 pb-32">
        <ProfileInfo profile={profile} />
      </div>
    </ProfileEditProvider>
  );
}
