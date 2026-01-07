'use client';

import { Profile } from '@/lib/types/profile';
import { createContext, ReactNode, useContext, useState } from 'react';

type ProfileEditData = Pick<Profile, 'nickname'> & {
  image: File | null;
};

type ProfileEditContextType = ProfileEditData & {
  setNickname: (nickname: string) => void;
  setImage: (file: File | null) => void;
  getEditData: () => ProfileEditData;
};

const ProfileEditContext = createContext<ProfileEditContextType | null>(null);

export function useProfileEdit() {
  const context = useContext(ProfileEditContext);
  if (!context) {
    throw new Error('useProfileEdit must be used within ProfileEditProvider');
  }
  return context;
}

interface ProfileEditProviderProps {
  children: ReactNode;
  initialNickname: Profile['nickname'];
  initialImage: Profile['image'];
}

export default function ProfileEditProvider({
  children,
  initialNickname,
}: ProfileEditProviderProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [image, setImage] = useState<File | null>(null);

  const getEditData = (): ProfileEditData => ({
    nickname,
    image,
  });

  return (
    <ProfileEditContext.Provider
      value={{ nickname, setNickname, image, setImage, getEditData }}
    >
      {children}
    </ProfileEditContext.Provider>
  );
}
