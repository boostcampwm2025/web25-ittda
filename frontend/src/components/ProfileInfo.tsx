'use client';

import { Camera, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useMemo, useEffect } from 'react';
import { useProfileEdit } from '../app/(main)/profile/edit/_components/ProfileEditContext';
import AssetImage from './AssetImage';

interface ProfileInfoProps {
  profileImage: string | null;
  showEmail?: boolean;
}

export default function ProfileInfo({
  profileImage,
  showEmail = false,
}: ProfileInfoProps) {
  const { image, setImage, nickname, setNickname, email } = useProfileEdit();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blob URL을 메모이제이션하여 불필요한 재생성 방지
  const imagePreviewUrl = useMemo(() => {
    return image ? URL.createObjectURL(image) : null;
  }, [image]);

  // Blob URL cleanup
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setImage(files[0]);
    }
  };

  // 닉네임 유효성 검사
  const getNicknameError = () => {
    if (nickname.length < 2) return '닉네임은 최소 2자 이상이어야 합니다.';
    if (nickname.length > 10) return '닉네임은 최대 10자까지 입력 가능합니다.';

    // 자음/모음만 있는지 체크
    const incompleteHangulRegex = /[ㄱ-ㅎㅏ-ㅣ]/;
    if (incompleteHangulRegex.test(nickname)) {
      return '완성된 한글을 입력해주세요';
    }

    // 허용된 문자만 사용했는지 체크
    const groupNameRegex = /^[가-힣a-zA-Z0-9\s]+$/;
    if (!groupNameRegex.test(nickname)) {
      return '한글, 영문, 숫자, 공백만 사용할 수 있어요';
    }

    return null;
  };

  const nicknameError = getNicknameError();

  return (
    <>
      <div className="py-8 flex flex-col gap-10">
        <div className="flex flex-col items-center">
          <button
            onClick={handleImageClick}
            className="relative group cursor-pointer"
          >
            <div className="flex justify-center items-center w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 overflow-hidden shadow-md transition-colors dark:border-[#1E1E1E] dark:bg-[#1E1E1E] border-gray-50 bg-gray-50">
              {imagePreviewUrl ? (
                <Image
                  width={128}
                  height={128}
                  src={imagePreviewUrl}
                  alt={`${nickname} 프로필`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AssetImage
                  className="w-full h-full object-cover"
                  width={128}
                  height={128}
                  assetId={profileImage || '/profile_base.png'}
                  alt={`${nickname} 프로필`}
                />
              )}
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
                className={`w-full border-b-2 bg-transparent px-1 py-4 text-base font-semibold transition-all outline-none dark:text-white dark:placeholder-gray-700 text-itta-black placeholder-gray-300 ${
                  nicknameError
                    ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500'
                    : 'dark:border-white/5 dark:focus:border-[#10B981] border-gray-100 focus:border-[#10B981]'
                }`}
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
            {nicknameError ? (
              <p className="text-[10px] text-red-500 px-1 font-medium">
                {nicknameError}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 px-1">
                * 닉네임은 한글/영문/숫자/공백만 사용이 가능합니다.
              </p>
            )}
          </div>

          {showEmail && email && (
            <div className="space-y-2 flex flex-col justify-center items-start gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                이메일 계정
              </label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full text-start border rounded-lg px-3 py-4 text-base font-semibold cursor-not-allowed transition-colors dark:bg-white/5 dark:border-white/5 dark:text-gray-500 bg-gray-50 border-gray-100 text-gray-400"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
