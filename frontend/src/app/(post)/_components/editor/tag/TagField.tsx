'use client';
import { X, Plus } from 'lucide-react';

interface Props {
  tags: string[];
  onRemove: (tag: string) => void;
  onAdd: () => void;
}

export const TagField = ({ tags, onRemove, onAdd }: Props) => {
  if (tags.length <= 0) return null;
  const MAX_TAGS = 4;
  const isLimitReached = tags.length >= MAX_TAGS;
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((tag) => (
        <div
          key={tag}
          onClick={onAdd}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shadow-sm transition-all w-fit"
        >
          <span className="flex items-center text-xs font-bold text-itta-black dark:text-gray-300 select-none leading-none">
            <span className="text-itta-point mr-0.5">#</span>
            {tag}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(tag);
            }}
            className="flex items-center text-itta-gray2 hover:text-rose-500 transition-colors active:scale-90"
            aria-label="태그 삭제"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {!isLimitReached && (
        <button
          onClick={onAdd}
          className="w-8 h-8 rounded-lg border border-dashed border-gray-200 text-itta-point flex items-center justify-center hover:bg-itta-point/5 transition-colors active:scale-90"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
};
