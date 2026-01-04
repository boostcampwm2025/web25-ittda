'use client';
import { X, Plus } from 'lucide-react';

interface Props {
  tags: string[];
  onRemove: (tag: string) => void;
  onAdd: () => void;
}

export const TagField = ({ tags, onRemove, onAdd }: Props) => (
  <div className="flex flex-wrap gap-1.5 items-center">
    {tags.map((tag) => (
      <div
        key={tag}
        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#FBFBFB] dark:bg-white/5 border border-gray-100/30 shadow-xs"
      >
        <span className="text-xs font-bold">
          <span className="text-itta-point">#</span>
          {tag}
        </span>
        <X
          className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-rose-500 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
        />
      </div>
    ))}
    <button
      onClick={onAdd}
      className="w-8 h-8 rounded-lg border border-dashed border-gray-200 text-itta-point flex items-center justify-center hover:bg-itta-point/5 transition-colors"
    >
      <Plus size={14} />
    </button>
  </div>
);
