import Image from 'next/image';
import { Film, X } from 'lucide-react';
import { MediaValue } from '@/lib/types/recordField';

interface Props {
  data: MediaValue | null;
  onClick: () => void;
  onRemove?: () => void;
  mode?: 'search' | 'editor';
}

export default function MediaField({
  data,
  onClick,
  onRemove,
  mode = 'editor',
}: Props) {
  if (!data) return null;

  const isSearchMode = mode === 'search';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 transition-all text-left group active:scale-[0.98] ${
        isSearchMode
          ? 'py-4 border-b border-gray-50 dark:border-white/5 last:border-none' // 검색 리스트 스타일
          : 'px-4 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm' // 에디터 필드 스타일
      }`}
    >
      <div className="relative w-14 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 border border-black/5">
        {data.image ? (
          <Image
            src={data.image}
            alt={data.title}
            fill
            sizes="56px"
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Film className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div className="flex-1 min-w-0 space-y-1 ">
        <h3
          className={`font-bold text-itta-black dark:text-gray-200 truncate ${isSearchMode ? 'text-sm' : 'text-md'}`}
        >
          {data.title}
        </h3>
        <p className="text-[11px] text-itta-gray3 font-medium uppercase tracking-wider">
          {data.type} • {data.year}
        </p>
      </div>

      {/* 에디터 모드 전용 */}
      {!isSearchMode && onRemove && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 -mr-2 text-gray-300 hover:text-rose-500 transition-colors active:scale-90 cursor-pointer"
          aria-label="미디어 삭제"
        >
          <X className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}
