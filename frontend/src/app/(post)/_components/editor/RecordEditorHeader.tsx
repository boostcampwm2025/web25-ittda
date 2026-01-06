'use client';

import { ArrowLeft } from 'lucide-react';

interface RecordEditorHeaderProps {
  mode: 'add' | 'edit';
  onSave: () => void;
  onBack?: () => void;
}

export default function RecordEditorHeader({
  mode,
  onSave,
  onBack,
}: RecordEditorHeaderProps) {
  return (
    <header className="sticky top-0 z-50 shrink-0 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b transition-colors duration-300 bg-white/95 border-gray-100 dark:bg-[#121212]/95 dark:border-white/5">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="p-1 -ml-1 active:scale-90 transition-transform focus:outline-none"
        aria-label="뒤로 가기"
      >
        <ArrowLeft className="w-6 h-6 text-itta-gray3 dark:text-white" />
      </button>

      {/* 페이지 제목 */}
      <h2 className="text-sm font-bold text-itta-black dark:text-gray-400">
        {mode === 'edit' ? '기록 수정' : '기록 작성'}
      </h2>

      {/* 저장 버튼 */}
      <button
        onClick={onSave}
        className={`px-5 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all shadow-sm 
          bg-itta-black text-white`}
      >
        저장
      </button>
    </header>
  );
}
