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
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(record.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(record.id);
        }
      }}
      className="w-full py-4 border-b text-left transition-colors duration-150 dark:border-white/5 border-gray-100 active:bg-gray-50/50 dark:active:bg-white/3 cursor-pointer"
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

      {/* 미리보기 이미지 */}
      {record.previewMediaIds.length > 0 && (
        <div className="mt-3">
          {record.previewMediaIds.length === 1 ? (
            <div className="rounded-xl overflow-hidden aspect-square w-36 sm:w-40">
              <AssetImage
                width={160}
                height={160}
                className="w-full h-full object-cover"
                assetId={record.previewMediaIds[0]}
                alt={record.title}
                priorityLoad={priorityLoad}
              />
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {record.previewMediaIds.map((id, idx) => (
                <div
                  key={id}
                  className="shrink-0 rounded-xl overflow-hidden h-28 sm:h-32 w-28 sm:w-32"
                >
                  <AssetImage
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    assetId={id}
                    alt={`${record.title} ${idx + 1}`}
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
};

export default SearchItem;
