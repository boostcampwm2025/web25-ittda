'use client';

import AssetImage from '@/components/AssetImage';
import { formatDotDateString } from '@/lib/date';
import { MapPostItem } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { ChevronRight, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

interface MapRecordItemProps {
  post: MapPostItem;
  isHighlighted: boolean;
  onClick: () => void;
}
export function MapRecordItem({
  post,
  isHighlighted,
  onClick,
}: MapRecordItemProps) {
  const [isError, setIsError] = useState(false);

  return (
    <div
      key={post.id}
      data-post-id={post.id}
      onClick={onClick}
      className={cn(
        'flex items-center gap-5 p-5 rounded-3xl border transition-all duration-300 group cursor-pointer active:scale-[0.97]',
        isHighlighted
          ? 'border-[#10B981] bg-[#10B981]/5 shadow-md scale-[1.02] ring-1 ring-[#10B981]/30'
          : 'dark:border-white/5 border-gray-100 bg-white dark:bg-white/2 shadow-sm hover:border-[#10B981]/30',
      )}
    >
      {post.thumbnailUrl && !isError && (
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-black/5">
          <AssetImage
            width={100}
            height={100}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setIsError(true)}
            assetId={post.thumbnailUrl}
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
        <p className="text-[11px] text-itta-gray3 flex items-center gap-1.5 font-medium">
          <MapPin className="w-3 h-3 text-itta-point" />
          {post.placeName}
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
      <ChevronRight
        size={18}
        className={cn(
          'transition-colors',
          isHighlighted ? 'text-[#10B981]' : 'text-gray-300',
        )}
      />
    </div>
  );
}
