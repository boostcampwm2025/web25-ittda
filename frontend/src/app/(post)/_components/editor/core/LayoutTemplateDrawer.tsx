'use client';

import {
  Layout,
  ChevronRight,
  Star,
  HouseIcon,
  Clapperboard,
  TicketsPlane,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { TemplateRecord } from '@/lib/types/template';

interface LayoutTemplateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customTemplates?: TemplateRecord[];
  onSelect: (template: TemplateRecord) => void;
}

const DEFAULT_TEMPLATES: TemplateRecord[] = [
  {
    id: 'travel-standard',
    title: '기본 일상',
    description: '가장 표준적인 기록 구성',
    icon: HouseIcon,
    blocks: [
      { type: 'date', layout: { row: 1, col: 1, span: 2 } },
      { type: 'time', layout: { row: 2, col: 1, span: 2 } },
      { type: 'location', layout: { row: 3, col: 1, span: 2 } },
      { type: 'emotion', layout: { row: 4, col: 1, span: 2 } },
      { type: 'tags', layout: { row: 5, col: 1, span: 2 } },
      { type: 'photos', layout: { row: 6, col: 1, span: 2 } },
      { type: 'content', layout: { row: 7, col: 1, span: 2 } },
      { type: 'rating', layout: { row: 8, col: 1, span: 2 } },
    ],
  },
  {
    id: 'culture-standard',
    title: '문화/취미',
    description: '영화, 책 등 미디어 감상 위주',
    icon: Clapperboard,
    blocks: [
      { type: 'date', layout: { row: 1, col: 1, span: 2 } },
      { type: 'time', layout: { row: 2, col: 1, span: 2 } },
      { type: 'media', layout: { row: 3, col: 1, span: 2 } },
      { type: 'rating', layout: { row: 4, col: 1, span: 2 } },
      { type: 'tags', layout: { row: 5, col: 1, span: 2 } },
      { type: 'content', layout: { row: 6, col: 1, span: 2 } },
      { type: 'photos', layout: { row: 7, col: 1, span: 2 } },
    ],
  },
  {
    id: 'travel-detail',
    title: '여행/맛집',
    description: '장소와 사진, 상세 비교표 중심',
    icon: TicketsPlane,
    blocks: [
      { type: 'date', layout: { row: 1, col: 1, span: 2 } },
      { type: 'time', layout: { row: 2, col: 1, span: 2 } },
      { type: 'location', layout: { row: 3, col: 1, span: 2 } },
      { type: 'photos', layout: { row: 4, col: 1, span: 2 } },
      { type: 'content', layout: { row: 5, col: 1, span: 2 } },
      { type: 'table', layout: { row: 6, col: 1, span: 2 } },
      { type: 'rating', layout: { row: 7, col: 1, span: 2 } },
      { type: 'tags', layout: { row: 8, col: 1, span: 2 } },
    ],
  },
];

// 개별 템플릿 아이템 컴포넌트
interface TemplateItemProps {
  template: TemplateRecord;
  isCustom?: boolean;
  onSelect: (template: TemplateRecord) => void;
  onClose: () => void;
}

function TemplateItem({
  template,
  isCustom = false,
  onSelect,
  onClose,
}: TemplateItemProps) {
  const IconComponent = isCustom ? Star : template.icon || Layout;

  return (
    <button
      onClick={() => {
        onSelect(template);
        onClose();
      }}
      className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 bg-gray-50 border-gray-100 hover:bg-gray-100"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center dark:bg-black/20 bg-white shadow-sm text-[#10B981]">
        <IconComponent
          size={20}
          className={isCustom ? 'text-amber-400 fill-amber-400' : ''}
        />
      </div>
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-sm font-bold truncate dark:text-white text-[#333]">
          {template.title}
        </h4>
        <p className="text-[11px] text-gray-400 truncate font-medium">
          {template.description || '구성 정보가 없습니다.'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </button>
  );
}

// 메인 드로어 컴포넌트
export default function LayoutTemplateDrawer({
  isOpen,
  onClose,
  customTemplates = [],
  onSelect,
}: LayoutTemplateDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="dark:bg-[#1E1E1E] bg-white">
        <div className="w-full p-8 pb-12 overflow-y-auto max-h-[85vh] hide-scrollbar">
          <DrawerHeader className="flex flex-col text-left p-0 mb-8">
            <p className="text-left text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
              LAYOUT TEMPLATE
            </p>
            <DrawerTitle className="text-left text-xl font-bold dark:text-white text-[#333]">
              자주 쓰는 기록 구성
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-6 mb-8">
            {/* 기본 템플릿 섹션 */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                기본 템플릿
              </p>
              {DEFAULT_TEMPLATES.map((t) => (
                <TemplateItem
                  key={t.id}
                  template={t}
                  onSelect={onSelect}
                  onClose={onClose}
                />
              ))}
            </div>

            {/* 나의 템플릿 섹션 */}
            {customTemplates.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest px-1">
                  나의 템플릿
                </p>
                {customTemplates.map((t) => (
                  <TemplateItem
                    key={t.id}
                    template={t}
                    isCustom
                    onSelect={onSelect}
                    onClose={onClose}
                  />
                ))}
              </div>
            )}
          </div>

          <DrawerClose asChild>
            <button className="w-full py-4 rounded-2xl font-bold text-sm dark:bg-white/5 dark:text-gray-400 bg-[#333333] text-white active:scale-95 transition-all">
              닫기
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
