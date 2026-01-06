'use client';

import { Group } from '@/lib/types/group';
import { Camera, X } from 'lucide-react';
import Image from 'next/image';
import React, { useRef } from 'react';
import { useGroupEdit } from './GroupEditContext';

type GroupInfoProps = Pick<Group, 'groupThumnail'>;

export default function GroupInfo({ groupThumnail }: GroupInfoProps) {
  const { groupName, setGroupName, groupThumbnail, setGroupThumbnail } =
    useGroupEdit();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <Image
              width={100}
              height={100}
              src={
                (groupThumbnail && URL.createObjectURL(groupThumbnail)) ||
                groupThumnail
              }
              className="w-full h-full object-cover opacity-80"
              alt=""
            />
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
    </section>
  );
}
