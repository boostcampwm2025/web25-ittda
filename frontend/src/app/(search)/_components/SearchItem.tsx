'use client';

import React from 'react';
import { ChevronRight, Clock, MapPin } from 'lucide-react';
import { RecordSearchItem } from '@/lib/types/record';
import { formatDotDateString } from '@/lib/date';
import AssetImage from '@/components/AssetImage';

interface SearchItemProps {
  record: RecordSearchItem;
  onClick: (id: string) => void;
  priorityLoad?: boolean;
}

const SearchItem: React.FC<SearchItemProps> = ({
  record,
  onClick,
  priorityLoad,
}) => {
  return (
    <button
      onClick={() => onClick(record.id)}
      className="w-full py-4 border-b text-left transition-colors duration-150 dark:border-white/5 border-gray-100 active:bg-gray-50/50 dark:active:bg-white/3"
    >
      {/* 텍스트 영역 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[15px] sm:text-base truncate dark:text-white text-itta-black">
            {record.title}
          </h4>

          <div className="flex justify-between items-center gap-2 mt-1 flex-wrap">
            {record.address && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                <MapPin className="w-3 h-3 text-[#10B981] shrink-0" />
                <span className="truncate max-w-40">{record.address}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              <Clock className="w-3 h-3 text-[#10B981] shrink-0" />
              {formatDotDateString(record.date)}
            </span>
          </div>

          {record.snippet && (
            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-2 leading-relaxed">
              {record.snippet}
            </p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      </div>

      {/* 썸네일 이미지 */}
      {record.thumbnailMediaId && (
        <div className="mt-3 rounded-xl overflow-hidden h-36 sm:h-40">
          <AssetImage
            width={600}
            height={160}
            className="w-full h-full object-cover"
            assetId={record.thumbnailMediaId}
            alt={record.title}
            priorityLoad={priorityLoad}
          />
        </div>
      )}
    </button>
  );
};

export default SearchItem;
