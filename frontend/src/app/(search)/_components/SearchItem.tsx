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
const thumbnailWrapperClass =
  'flex items-center justify-center w-12 h-12 shrink-0 rounded-md overflow-hidden ' +
  'border border-gray-200 dark:border-white/10 ' +
  'bg-gray-50 dark:bg-white/5';

const SearchItem: React.FC<SearchItemProps> = ({ record, onClick }) => {
  return (
    <button
      onClick={() => onClick(record.id)}
      className="w-full flex items-center gap-4 py-4 px-3 rounded-xl border  text-left shadow-sm active:scale-[0.98] group bg-white border-gray-100/50 dark:bg-[#1E1E1E] dark:border-white/5"
    >
      {/* 썸네일 이미지 */}
      <div className={thumbnailWrapperClass}>
        {record.thumbnailMediaId ? (
          <AssetImage
            assetId={record.thumbnailMediaId}
            alt={record.title}
            width={48}
            height={48}
            className="w-full h-full "
          />
        ) : (
          <ImageIcon className="text-gray-400" />
        )}
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="flex-1">
        <h4 className="text-sm font-bold truncate mb-1 text-itta-black dark:text-white  transition-colors">
          {record.title}
        </h4>

        <div className="flex items-center gap-2 text-xs text-itta-gray3">
          <div className="flex items-center justify-center gap-1 truncate">
            <Calendar size={12} className="shrink-0 text-itta-point" />
            <span>{formatDateDot(new Date(record.date))}</span>
          </div>

          {record.address && (
            <div className="flex items-center gap-0.5 truncate">
              <MapPin size={10} className="shrink-0 text-itta-point" />
              <span>{record.address}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default SearchItem;
