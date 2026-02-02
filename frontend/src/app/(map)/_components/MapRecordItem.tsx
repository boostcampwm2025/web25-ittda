'use client';

import AssetImage from '@/components/AssetImage';
import { formatDotDateString } from '@/lib/date';
import { randomBaseImage } from '@/lib/image';
import { MapPostItem } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { ChevronRight, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

interface MapRecordItemProps {
  post: MapPostItem;
  isHighlighted: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}
export function MapRecordItem({
  post,
  isHighlighted,
  onSelect,
  onNavigate,
}: MapRecordItemProps) {
  const [isError, setIsError] = useState(false);

  return (
    <div
      key={post.id}
      data-post-id={post.id}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 py-4 px-3 rounded-3xl border transition-all duration-300 group cursor-pointer active:scale-[0.97]',
        isHighlighted
          ? 'border-[#10B981] bg-[#10B981]/5 shadow-md scale-[1.02] ring-1 ring-[#10B981]/30'
          : 'dark:border-white/5 border-gray-100 bg-white dark:bg-white/2 shadow-sm hover:border-[#10B981]/30',
        !post.thumbnailMediaId && 'px-5',
      )}
    >
      {post.thumbnailMediaId && (
        <div className="border-2 shadow-sm bg-white dark:border-[#121212] border-white w-16 h-16 rounded-2xl overflow-hidden shrink-0">
          <AssetImage
            width={64}
            height={64}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setIsError(true)}
            assetId={post.thumbnailMediaId ?? randomBaseImage(post.id)}
            alt={post.title}
          />
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-1.5">
        <h4
          className={cn(
            'font-bold truncate text-sm transition-colors',
            isHighlighted ? 'text-[#10B981]' : 'dark:text-white',
          )}
        >
          {post.title}
        </h4>
        <p className="text-[11px] text-itta-gray3 flex items-center gap-1.5 font-medium min-w-0">
          <MapPin className="w-3 h-3 text-itta-point shrink-0" />
          <span className="truncate">{post.placeName}</span>
        </p>
        <p className="text-[11px] text-itta-gray3 flex items-center gap-1.5 font-medium">
          <Clock className="w-3 h-3 text-itta-point" />
          {formatDotDateString(post.createdAt)}
        </p>
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 2).map((tag: string) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md dark:bg-white/5 bg-[#F9F9F9]"
            >
              <span className="text-[#10B981] font-bold">#</span>
              <span className="dark:text-gray-400 text-gray-600">{tag}</span>
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate();
        }}
        className={cn(
          'flex items-center p-3 rounded-full text-xs font-bold transition-all active:scale-95',
          isHighlighted
            ? 'bg-[#10B981] text-white shadow-md'
            : 'dark:bg-white/5 dark:text-gray-300 bg-gray-100 text-gray-600 hover:bg-[#10B981]/10',
        )}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
