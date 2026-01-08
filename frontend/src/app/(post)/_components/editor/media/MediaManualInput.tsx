import {
  ChevronDown,
  ChevronUp,
  Film,
  Theater,
  LucideMusic4,
} from 'lucide-react';
import { CategoryChip } from './MediaCategoryChip';

interface ManualInputProps {
  manualType: string;
  setManualType: (val: string) => void;
  manualTitle: string;
  setManualTitle: (val: string) => void;
  manualYear: string;
  setManualYear: (val: string) => void;
}

const CATEGORIES = [
  { id: 'movie', label: '영화', icon: Film },
  { id: 'theater', label: '연극', icon: Theater },
  { id: 'musical', label: '뮤지컬', icon: LucideMusic4 },
];

export const MediaManualInput = ({
  manualType,
  setManualType,
  manualTitle,
  setManualTitle,
  manualYear,
  setManualYear,
}: ManualInputProps) => {
  return (
    <div className="px-8 py-2 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 카테고리 섹션 */}
      <section className="space-y-4">
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-itta-point uppercase tracking-widest mb-1">
            CATEGORY
          </span>
          <span className="text-xs font-bold text-itta-gray3">카테고리</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              Icon={cat.icon}
              label={cat.label}
              onClick={() => setManualType(cat.label)}
              isActive={manualType === cat.label}
              layout="v"
            />
          ))}
        </div>
      </section>

      {/* 제목 섹션 */}
      <section className="space-y-2">
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-itta-point uppercase tracking-widest mb-1">
            TITLE
          </span>
          <span className="text-xs font-bold text-itta-gray3">제목</span>
        </div>
        <input
          type="text"
          placeholder="직접 입력해 주세요"
          value={manualTitle}
          onChange={(e) => setManualTitle(e.target.value)}
          className="w-full bg-transparent border-b border-gray-100 dark:border-white/10 py-3 text-xl font-bold text-[#333] dark:text-white outline-none focus:border-itta-point transition-colors placeholder:text-gray-200"
        />
      </section>

      {/* 연도 섹션 */}
      <section className="space-y-2">
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-itta-point uppercase tracking-widest mb-1">
            RELEASE YEAR
          </span>
          <span className="text-xs font-bold text-itta-gray3">
            출시/발매 연도
          </span>
        </div>
        <div className="relative border-b border-gray-100 dark:border-white/10 py-3">
          <input
            type="text"
            inputMode="numeric"
            value={manualYear}
            onChange={(e) => setManualYear(e.target.value)}
            className="w-full bg-transparent text-xl font-bold text-[#333] dark:text-white outline-none scrollbar-hide"
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col text-itta-gray3 gap-1">
            <button
              onClick={() => setManualYear(String(Number(manualYear) + 1))}
            >
              <ChevronUp className="w-5 h-5 hover:text-itta-point" />
            </button>
            <button
              onClick={() => setManualYear(String(Number(manualYear) - 1))}
            >
              <ChevronDown className="w-5 h-5 hover:text-itta-point" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
