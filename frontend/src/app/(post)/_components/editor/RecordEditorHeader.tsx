'use client';

import Back from '@/components/Back';
import { useDraftPresence } from '@/hooks/useDraftPresence';
import Image from 'next/image';

interface RecordEditorHeaderProps {
  mode: 'add' | 'edit';
  onSave: () => void;
  onBack?: () => void;
  draftId?: string;
}
const dummyMembers = [
  {
    sessionId: 's1',
    actorId: 'user-1',
    nickname: '나',
  },
  {
    sessionId: 's2',
    actorId: 'user-2',
    nickname: '김철수',
  },
  {
    sessionId: 's3',
    actorId: 'user-3',
    nickname: '이영희',
  },
  {
    sessionId: 's4',
    actorId: 'user-4',
    nickname: '박지민',
  },
];
export default function RecordEditorHeader({
  mode,
  onSave,
  draftId,
}: RecordEditorHeaderProps) {
  let { members } = useDraftPresence(draftId);

  // 임시로 둠
  // TODO: 타입 추가
  if (members.length === 0) {
    members = dummyMembers;
  }
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
            {members.slice(0, 4).map((member, idx) => (
              <div
                key={member?.sessionId || idx}
                className="relative inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#121212]"
                title={member?.displayName || '참여자'}
              >
                <Image
                  src={member?.profileUrl || '/profile-ex.jpeg'}
                  alt="참여자 프로필"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ))}
          </div>
          {members.length > 0 && (
            <div className="flex h-7 items-center justify-center pl-3">
              <span className="text-[10px] font-medium text-gray-500">
                {members.length}명 편집 중
              </span>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
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
