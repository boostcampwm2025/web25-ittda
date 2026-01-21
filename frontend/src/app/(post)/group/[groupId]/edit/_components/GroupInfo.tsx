'use client';

import { Group } from '@/lib/types/group';
import { Camera, ChevronRight, Users, X } from 'lucide-react';
import Image from 'next/image';
import React, { useRef } from 'react';
import { useGroupEdit } from './GroupEditContext';
import { useRouter } from 'next/navigation';

type GroupInfoProps = Pick<Group, 'groupThumnail'> & {
  groupId: string;
  nickname: Group['nicknameInGroup'];
};

export default function GroupInfo({ groupId, nickname }: GroupInfoProps) {
  const { groupName, setGroupName, groupThumbnail, setGroupThumbnail } =
    useGroupEdit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setGroupThumbnail(files[0]);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center mb-6">
        <button onClick={handleImageClick} className="relative cursor-pointer">
          <div className="w-24 h-24 rounded-[32px] flex items-center justify-center border-4 shadow-sm overflow-hidden dark:bg-[#1E1E1E] dark:border-[#121212] bg-gray-50 border-white">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {groupThumbnail ? (
              <Image
                width={100}
                height={100}
                src={
                  typeof groupThumbnail === 'object' && groupThumbnail !== null
                    ? URL.createObjectURL(groupThumbnail)
                    : groupThumbnail
                }
                className="w-full h-full object-cover opacity-80"
                alt="그룹 썸네일"
              />
            ) : (
              <Users className="w-1/3 h-1/3 text-gray-400" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-itta-black text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <Camera className="w-4 h-4" />
          </div>
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
          그룹 이름
        </label>
        <div className="relative">
          <input
            type="text"
            value={groupName}
            placeholder="그룹명을 작성해주세요."
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full border-b-2 bg-transparent px-1 py-3 text-lg font-bold transition-all outline-none dark:border-white/5 dark:focus:border-[#10B981] dark:text-white border-gray-100 focus:border-[#10B981] text-itta-black"
          />
          {groupName && (
            <button
              onClick={() => setGroupName('')}
              className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <label className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest px-1">
          나의 그룹 프로필
        </label>
        <button
          onClick={() => router.push(`/group/${groupId}/edit/profile`)}
          className="cursor-pointer mt-4 w-full flex items-center justify-between p-5 rounded-3xl border transition-all active:scale-[0.98] dark:bg-[#10B981]/5 dark:border-[#10B981]/10 dark:hover:bg-[#10B981]/10 bg-[#10B981]/5 border-[#10B981]/10 hover:bg-[#10B981]/10"
        >
          <div className="flex items-center gap-4">
            <Image
              width={50}
              height={50}
              src="/profile-ex.jpeg"
              className="w-12 h-12 rounded-2xl border bg-white shadow-sm shrink-0"
              alt="그룹에서 나의 프로필"
            />
            <div className="text-left">
              <p className="text-sm font-bold dark:text-white text-itta-black">
                {nickname}
              </p>
              <p className="text-[11px] text-[#10B981] font-medium">
                이 그룹 전용 프로필 설정하기
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#10B981]/50" />
        </button>
      </section>
    </section>
  );
}
