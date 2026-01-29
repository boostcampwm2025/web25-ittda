'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { RecordSearchItem } from '@/lib/types/record';
import { formatDateDot } from '@/lib/date';
interface SearchItemProps {
  record: RecordSearchItem;
  onClick: (id: string) => void;
}

const SearchItem: React.FC<SearchItemProps> = ({ record, onClick }) => {
  return (
    <button
      onClick={() => onClick(record.id)}
      className="w-full flex items-center gap-4 p-4 rounded-xl border  text-left shadow-sm active:scale-[0.98] group bg-white border-gray-100/50 dark:bg-[#1E1E1E] dark:border-white/5"
    >
      {/* 썸네일 이미지 */}
      {record.imageUrl && (
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-50 dark:bg-white/5">
          <Image
            src={record.imageUrl}
            alt={record.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      )}

      {/* 텍스트 콘텐츠 */}
      <div className="flex-1">
        <h4 className="text-sm font-bold truncate mb-1 text-itta-black dark:text-white  transition-colors">
          {record.title}
        </h4>

        <div className="flex items-center gap-2 text-xs text-itta-gray3">
          <span>{formatDateDot(new Date(record.date))}</span>

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
