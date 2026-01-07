'use client';

import { Camera, X } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import { useProfileEdit } from '../app/(main)/profile/edit/_components/ProfileEditContext';

interface ProfileInfoProps {
  profileImage: string;
  showEmail?: boolean;
}

export default function ProfileInfo({
  profileImage,
  showEmail = false,
}: ProfileInfoProps) {
  const { image, setImage, nickname, setNickname, email } = useProfileEdit();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setImage(files[0]);
    }
  };

  return (
    <>
      <div className="py-8 flex flex-col gap-10">
        <div className="flex flex-col items-center">
          <button
            onClick={handleImageClick}
            className="relative group cursor-pointer"
          >
            <div className="w-32 h-32 rounded-full border-4 overflow-hidden shadow-md transition-colors dark:border-[#1E1E1E] dark:bg-[#1E1E1E] border-gray-50 bg-gray-50">
              <Image
                width={100}
                height={100}
                src={(image && URL.createObjectURL(image)) || profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-10 h-10 text-white bg-itta-black rounded-full flex items-center justify-center border-2 border-white shadow-lg active:scale-90 transition-all">
              <Camera className="w-5 h-5" />
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div className="w-full space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              닉네임
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full border-b-2 bg-transparent px-1 py-4 text-sm font-semibold transition-all outline-none dark:border-white/5 dark:focus:border-[#10B981] dark:text-white dark:placeholder-gray-700 border-gray-100 focus:border-[#10B981] text-itta-black placeholder-gray-300"
                placeholder="사용할 닉네임을 입력해 주세요"
              />
              {nickname && (
                <button
                  onClick={() => setNickname('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 px-1">
              기억하고 싶은 이름으로 나를 표현해 보세요.
            </p>
          </div>

          {showEmail && email && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                이메일 계정
              </label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full border rounded-2xl px-5 py-4 text-sm font-semibold cursor-not-allowed transition-colors dark:bg-white/5 dark:border-white/5 dark:text-gray-600 bg-gray-50 border-gray-100 text-gray-300"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
