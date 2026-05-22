'use client';

import AssetImage from '@/components/AssetImage';
import { formatDotDateString } from '@/lib/date';
import { MapPostItem } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { ChevronRight, Clock, MapPin } from 'lucide-react';
import React from 'react';

interface MapRecordItemProps {
  post: MapPostItem;
  isHighlighted: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onNavigate: () => void;
  priorityLoad?: boolean;
}

export function MapRecordItem({
  post,
  isHighlighted,
  onSelect,
  onNavigate,
  priorityLoad,
}: MapRecordItemProps) {
  return (
    <div
      data-post-id={post.id}
      onClick={onSelect}
      className={cn(
        'py-4 border-b transition-colors duration-150 cursor-pointer',
        isHighlighted
          ? 'dark:border-[#10B981]/20 border-[#10B981]/20'
          : 'dark:border-white/5 border-gray-100',
      )}
    >
      {/* 텍스트 영역 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-bold text-[15px] sm:text-base truncate transition-colors',
              isHighlighted
                ? 'text-[#10B981]'
                : 'dark:text-white text-itta-black',
            )}
          >
            {post.title}
          </h4>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {post.placeName && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                <MapPin className="w-3 h-3 text-[#10B981] shrink-0" />
                <span className="truncate max-w-40">{post.placeName}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              <Clock className="w-3 h-3 text-[#10B981] shrink-0" />
              {formatDotDateString(post.createdAt)}
            </span>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 4).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          className={cn(
            'shrink-0 mt-0.5 p-1.5 rounded-lg transition-colors active:scale-95',
            isHighlighted
              ? 'text-[#10B981]'
              : 'text-gray-400 dark:text-gray-500 hover:text-[#10B981] dark:hover:text-[#10B981]',
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 이미지 스트립 (하단) */}
      {(post.previewMediaIds?.length ?? 0) > 0 && (
        <div className="mt-3">
          {post.previewMediaIds?.length === 1 ? (
            <div className="rounded-xl overflow-hidden h-36 sm:h-40">
              <AssetImage
                width={600}
                height={160}
                className="w-full h-full object-cover"
                assetId={post.previewMediaIds[0]}
                alt={post.title}
                priorityLoad={priorityLoad}
              />
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {post.previewMediaIds.map((id, idx) => (
                <div
                  key={id}
                  className="shrink-0 rounded-xl overflow-hidden h-28 sm:h-32 w-28 sm:w-32"
                >
                  <AssetImage
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    assetId={id}
                    alt={`${post.title} ${idx + 1}`}
                    priorityLoad={priorityLoad && idx === 0}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
