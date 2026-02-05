'use client';

import {
  Image as ImageIcon,
  Smile,
  Tag as TagIcon,
  MapPin,
  Star,
  Search,
  Table,
  Type,
  Layout,
  Save,
} from 'lucide-react';
import { FieldType } from '@/lib/types/record';

// 아이콘 설정
const TOOL_ITEMS = [
  { id: 'content', Icon: Type },
  { id: 'photos', Icon: ImageIcon },
  { id: 'emotion', Icon: Smile },
  { id: 'tags', Icon: TagIcon },
  { id: 'location', Icon: MapPin },
  { id: 'table', Icon: Table },
  { id: 'rating', Icon: Star },
  { id: 'media', Icon: Search },
] as const;

interface ToolbarProps {
  onAddBlock: (type: FieldType) => void;
  onOpenDrawer: (drawerType: {
    type: FieldType | 'layout' | 'saveLayout';
  }) => void;
}

// TODO: 템플릿 관련 임시 주석처리

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Toolbar({ onAddBlock, onOpenDrawer }: ToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-4xl mx-auto flex flex-col gap-3 w-full">
      {/* 상단 플로팅 버튼 */}
      {/* <div className="w-full flex gap-3 justify-start px-6">
        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-3 md:px-6 py-3 rounded-full bg-[#333333] text-white text-xs md:text-sm font-bold shadow-xl active:scale-95 transition-all"
        >
          <Layout size={18} /> 레이아웃 템플릿
        </button>
        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-3 md:px-6 py-3 rounded-full bg-[#10B981] text-white text-xs md:text-sm font-bold shadow-xl active:scale-95 transition-all"
        >
          <Save size={18} /> 내 템플릿 저장
        </button>
      </div> */}

      <div className="w-full bg-white dark:bg-[#2A2A2A] border-t border-gray-100 dark:border-white/5 p-4 flex justify-around items-center">
        {TOOL_ITEMS.map(({ id, Icon }) => (
          <button
            key={id}
            onClick={() => onAddBlock(id as FieldType)}
            className="p-2 text-itta-gray3 hover:text-[#10B981] dark:text-gray-500 dark:hover:text-[#10B981] transition-colors active:scale-110"
          >
            <Icon size={24} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
}
