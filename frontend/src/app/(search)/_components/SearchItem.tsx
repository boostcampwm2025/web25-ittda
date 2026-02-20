'use client';

import React from 'react';
import { Calendar, ImageIcon, MapPin } from 'lucide-react';
import { RecordSearchItem } from '@/lib/types/record';
import { formatDateDot } from '@/lib/date';
import AssetImage from '@/components/AssetImage';
interface SearchItemProps {
  record: RecordSearchItem;
  onClick: (id: string) => void;
}

const SearchItem: React.FC<SearchItemProps> = ({ record, onClick }) => {
  return (
    <button
      onClick={() => onClick(record.id)}
      className="w-full flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-xl border text-left shadow-sm active:scale-[0.98] group bg-white border-gray-100/50 dark:bg-[#1E1E1E] dark:border-white/5"
    >
      {/* 썸네일 이미지 */}
      {record.thumbnailMediaId ? (
        <div className="flex justify-center items-center relative w-10 sm:w-12 h-10 sm:h-12 rounded-xl overflow-hidden shrink-0 bg-gray-50 dark:bg-white/5">
          <AssetImage
            assetId={record.thumbnailMediaId}
            alt={record.title}
            width={48}
            height={48}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12">
          <ImageIcon className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400" />
        </div>
      )}

      {/* 텍스트 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] sm:text-sm font-bold truncate mb-1 sm:mb-1.5 text-itta-black dark:text-white transition-colors">
          {record.title}
        </h4>
        {record.snippet && (
          <p className="text-[11px] sm:text-xs text-itta-gray mb-0.5 sm:mb-1 truncate">
            {record.snippet}
          </p>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-itta-gray3">
          <div className="flex items-center gap-0.5 sm:gap-1 truncate">
            <Calendar size={9} className="shrink-0 text-itta-point sm:hidden" />
            <Calendar size={10} className="shrink-0 text-itta-point hidden sm:block" />
            <span>{formatDateDot(new Date(record.date))}</span>
          </div>

          {record.address && (
            <div className="flex items-center gap-0.5 sm:gap-1 truncate">
              <MapPin size={9} className="shrink-0 text-itta-point sm:hidden" />
              <MapPin size={10} className="shrink-0 text-itta-point hidden sm:block" />
              <span>{record.address}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default SearchItem;
