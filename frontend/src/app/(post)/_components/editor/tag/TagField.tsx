'use client';
import { Plus, Tag } from 'lucide-react';
import {
  FieldDefaultButton,
  FieldDefaultButtonIcon,
  FieldDefaultButtonLabel,
} from '../core/FieldDefaultButton';
import { FieldDeleteButton } from '../core/FieldDeleteButton';
import { TagValue } from '@/lib/types/record';

interface Props {
  tags: TagValue;
  onRemove: (tag: string) => void;
  onAdd: () => void;
  onRemoveField: () => void;
}

export const TagField = ({ tags, onRemove, onAdd, onRemoveField }: Props) => {
  if (tags.tags.length <= 0)
    return (
      <div className="flex items-center gap-2 w-full py-1 group">
        <FieldDefaultButton onClick={onAdd}>
          <FieldDefaultButtonIcon icon={Tag} />
          <FieldDefaultButtonLabel>태그 추가하기</FieldDefaultButtonLabel>
        </FieldDefaultButton>
        <FieldDeleteButton
          onRemove={onRemoveField}
          ariaLabel="태그 필드 삭제"
        />
      </div>
    );
  const MAX_TAGS = 4;
  const isLimitReached = tags.tags.length >= MAX_TAGS;
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.tags.map((tag) => (
        <div
          key={tag}
          onClick={onAdd}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shadow-sm transition-all w-fit"
        >
          <span className="flex items-center text-xs font-bold text-itta-black dark:text-gray-300 select-none leading-none">
            <span className="text-itta-point mr-0.5">#</span>
            {tag}
          </span>

          <FieldDeleteButton
            onRemove={() => onRemove(tag)}
            ariaLabel="태그 필드 삭제"
          />
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
