'use client';

import {
  Image as ImageIcon,
  Smile,
  Tag as TagIcon,
  MapPin,
  LayoutGrid,
  Star,
  Search,
  Layout,
  Save,
  LucideIcon,
} from 'lucide-react';

// 툴바 전체 Props
interface ToolbarProps {
  onTagClick: () => void;
  onRatingClick: () => void;
  onPhotoClick: () => void;
  onEmotionClick?: () => void;
}

// 개별 아이콘 버튼 Props
interface ToolbarIconProps {
  Icon: LucideIcon;
  onClick: () => void;
}

export default function Toolbar({
  onTagClick,
  onRatingClick,
  onPhotoClick,
}: ToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-4xl mx-auto flex flex-col items-center gap-3 w-full">
      {/* 상단 플로팅 버튼 */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-3 md:px-6 py-3 rounded-full bg-[#333333] text-white text-sm font-bold shadow-xl active:scale-95 transition-all">
          <Layout size={18} /> 레이아웃 템플릿
        </button>
        <button className="flex items-center gap-2 px-3 md:px-6 py-3 rounded-full bg-[#10B981] text-white text-sm font-bold shadow-xl active:scale-95 transition-all">
          <Save size={18} /> 내 템플릿 저장
        </button>
      </div>

      {/* 하단 아이콘 바 */}
      <div className="w-full bg-white dark:bg-[#2A2A2A] border border-gray-100 dark:border-white/5 p-4 flex justify-around items-center">
        <ToolbarIcon Icon={ImageIcon} onClick={onPhotoClick} />
        <ToolbarIcon Icon={Smile} onClick={() => {}} />
        <ToolbarIcon Icon={TagIcon} onClick={onTagClick} />
        <ToolbarIcon Icon={MapPin} onClick={() => {}} />
        <ToolbarIcon Icon={LayoutGrid} onClick={() => {}} />
        <ToolbarIcon Icon={Star} onClick={onRatingClick} />
        <ToolbarIcon Icon={Search} onClick={() => {}} />
      </div>
    </div>
  );
}

function ToolbarIcon({ Icon, onClick }: ToolbarIconProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-itta-gray3 hover:text-[#10B981] dark:text-gray-500 dark:hover:text-[#10B981] transition-colors active:scale-110"
    >
      <Icon size={24} strokeWidth={1.5} />
    </button>
  );
}
