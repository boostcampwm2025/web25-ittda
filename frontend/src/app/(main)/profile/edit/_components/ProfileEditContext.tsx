'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

type ProfileEditData = {
  nickname: string;
  image: File | null;
};

type ProfileEditContextType = ProfileEditData & {
  setNickname: (nickname: string) => void;
  setImage: (file: File | null) => void;
  getEditData: () => ProfileEditData;
  initialImage?: string;
  email?: string;
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
  initialNickname: string;
  initialImage?: string;
  email?: string;
}

export default function ProfileEditProvider({
  children,
  initialNickname,
  initialImage,
  email,
}: ProfileEditProviderProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [image, setImage] = useState<File | null>(null);

  const getEditData = (): ProfileEditData => ({
    nickname,
    image,
  });

  return (
    <ProfileEditContext.Provider
      value={{
        nickname,
        setNickname,
        image,
        setImage,
        getEditData,
        initialImage,
        email,
      }}
    >
      {children}
    </ProfileEditContext.Provider>
  );
}
