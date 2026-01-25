'use client';

import Back from '@/components/Back';
import { PresenceMember } from '@/hooks/useDraftPresence';
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
  return (
    <header className="sticky top-0 z-50 shrink-0 backdrop-blur-md px-5 py-4 flex items-center backdrop-blur-md transition-colors duration-300 bg-white/95 dark:bg-[#121212]/95">
      <div className="flex-1 flex justify-start">
        <Back />
      </div>

      <h2 className="flex-none text-sm font-bold text-itta-black dark:text-gray-400 whitespace-nowrap">
        {mode === 'edit' ? '기록 수정' : '기록 작성'}
      </h2>

      <div className="flex-1 flex items-center justify-end gap-4">
        <div className="flex">
          <div className="flex -space-x-2 overflow-hidden hidden sm:block">
            {members?.slice(0, 4).map((member) => (
              <div
                key={member?.sessionId || member.actorId}
                className="relative inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#121212]"
                title={member?.displayName || '참여자'}
              >
                {/**TODO : 추후 유저 이미지 받아와서 추가 */}
                <Image
                  src={'/profile-ex.jpeg'}
                  alt="참여자 프로필"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ))}
          </div>
          {members && members.length > 0 && (
            <div className="flex h-7 items-center justify-center pl-3">
              <span className="text-[10px] font-medium text-gray-500">
                {members.length}명 편집 중
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onSave}
          className="px-5 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all shadow-sm bg-itta-black text-white"
        >
          저장
        </button>
      </div>
    </header>
  );
}
