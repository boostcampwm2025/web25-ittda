'use client';

import { Profile } from '@/lib/types/profile';
import ProfileEditProvider from './ProfileEditContext';
import ProfileEditHeaderActions from '@/components/ProfileEditHeaderActions';
import ProfileInfo from '@/components/ProfileInfo';

interface ProfileEditClientProps {
  profile: Profile;
}

export default function ProfileEditClient({ profile }: ProfileEditClientProps) {
  return (
    <ProfileEditProvider
      initialNickname={profile.nickname}
      initialImage={profile.image}
      email={profile.email}
    >
      <ProfileEditHeaderActions redirectPath="/profile" />
      <div className="p-8 flex flex-col gap-10 pb-32">
        <ProfileInfo profileImage={profile.image} showEmail={true} />
      </div>
    </ProfileEditProvider>
  );
}
