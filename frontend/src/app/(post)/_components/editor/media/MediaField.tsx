import Image from 'next/image';
import { Film, Search } from 'lucide-react';
import { MediaValue } from '@/lib/types/recordField';
import {
  FieldDefaultButton,
  FieldDefaultButtonIcon,
  FieldDefaultButtonLabel,
} from '../core/FieldDefaultButton';
import { FieldDeleteButton } from '../core/FieldDeleteButton';

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
  const isEmpty = data && Object.values(data).every((value) => value === '');

  if (mode == 'editor' && isEmpty) {
    return (
      <div className="flex items-center gap-2 w-full py-1 group">
        <FieldDefaultButton onClick={onClick}>
          <FieldDefaultButtonIcon icon={Search} />
          <FieldDefaultButtonLabel>
            관련 정보 찾기(영화, 연극 등)
          </FieldDefaultButtonLabel>
        </FieldDefaultButton>
        {onRemove && (
          <FieldDeleteButton onRemove={onRemove} ariaLabel="미디어 필드 삭제" />
        )}
      </div>
    );
  }
  if (isEmpty || !data) {
    return null;
  }

  const isSearchMode = mode === 'search';

  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-4 transition-all text-left group active:scale-[0.98] ${
        isSearchMode
          ? 'py-4 border-b border-gray-50 dark:border-white/5 last:border-none' // 검색 리스트 스타일
          : 'px-4 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm' // 에디터 필드 스타일
      }`}
    >
      <div className="relative w-14 h-20 rounded-md overflow-hidden shrink-0 bg-gray-100 border border-black/5">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.title}
            width={56}
            height={80}
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
        <FieldDeleteButton onRemove={onRemove} ariaLabel="미디어 필드 삭제" />
      )}
    </div>
  );
}
