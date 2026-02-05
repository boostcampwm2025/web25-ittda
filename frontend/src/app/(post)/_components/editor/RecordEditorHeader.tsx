'use client';

import { useState } from 'react';
import Back from '@/components/Back';
import { PresenceMember } from '@/hooks/useDraftPresence';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import AssetImage from '@/components/AssetImage';
import Image from 'next/image';

interface RecordEditorHeaderProps {
  mode: 'add' | 'edit';
  onSave: () => void;
  onBack?: () => void;
  members?: PresenceMember[];
}

export default function RecordEditorHeader({
  mode,
  onSave,
  members,
}: RecordEditorHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const memberList = members ?? [];
  const hasMembers = memberList.length > 0;
  const titleText = mode === 'edit' ? '기록 수정' : '기록 작성';

  const displayMembers = memberList.slice(0, 4);
  const extraCount = memberList.length - 4;
  return (
    <header className="sticky top-0 z-50 shrink-0 px-5 py-4 flex items-center backdrop-blur-md transition-colors duration-300 bg-white/95 dark:bg-[#121212]/95 border-b border-gray-100 dark:border-white/5">
      <div className="flex-1 flex items-center justify-start gap-3">
        <Back />
        <h2 className="sm:hidden text-sm font-bold text-itta-black dark:text-gray-400 whitespace-nowrap">
          {titleText}
        </h2>
      </div>

      <h2 className="hidden sm:block flex-none text-sm font-bold text-itta-black dark:text-gray-400 whitespace-nowrap">
        {titleText}
      </h2>
      <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
        {hasMembers && (
          <div className="flex items-center">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <div
                  className="flex -space-x-2 overflow-hidden cursor-pointer items-center"
                  onMouseEnter={() => setIsOpen(true)}
                  onMouseLeave={() => setIsOpen(false)}
                >
                  {displayMembers.map((member) => (
                    <div
                      key={member?.sessionId || member.actorId}
                      className="relative inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#121212] flex-shrink-0 bg-white dark:bg-[#121212] isolate"
                    >
                      {member.profileImageId ? (
                        <AssetImage
                          assetId={member.profileImageId}
                          alt={`${member.displayName} 프로필 이미지`}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <Image
                          width={50}
                          height={50}
                          src={'/profile_base.png'}
                          alt={`${member.displayName} 프로필 이미지`}
                          className="rounded-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <div className="relative flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-[#121212] text-[10px] font-bold text-gray-600 dark:text-gray-400">
                      +{extraCount}
                    </div>
                  )}
                </div>
              </PopoverTrigger>

              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={10}
                collisionPadding={14}
                className="w-48 p-2 bg-white dark:bg-[#1E1E1E] shadow-xl border-gray-100 dark:border-white/10"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
              >
                <div className="px-2 py-1.5 mb-1 border-b border-gray-50 dark:border-white/5">
                  <span className="text-xs font-semibold text-itta-gray3 uppercase tracking-wider">
                    편집 중인 멤버 ({memberList.length})
                  </span>
                </div>
                <div className="overflow-y-auto pr-1 max-h-60 pb-0!">
                  {memberList.map((member) => (
                    <div
                      key={member.sessionId || member.actorId}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item"
                    >
                      <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/10">
                        {member.profileImageId ? (
                          <AssetImage
                            assetId={
                              member.profileImageId || '/profile_base.png'
                            }
                            alt={`${member.displayName} 프로필 이미지`}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <Image
                            fill
                            src={'/profile_base.png'}
                            alt={`${member.displayName} 프로필 이미지`}
                            className="rounded-full object-cover"
                          />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {member.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="hidden sm:flex h-7 items-center justify-center pl-3">
              <span className="text-xs font-medium text-gray-500">
                {memberList.length}명 편집 중
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onSave}
          className="px-5 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all shadow-sm bg-itta-black text-white shrink-0"
        >
          저장
        </button>
      </div>
    </header>
  );
}
