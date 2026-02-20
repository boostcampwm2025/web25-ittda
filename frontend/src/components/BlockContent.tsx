'use client';

import { Block, ImageValue } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Film, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import ImageCarousel from './ImageCarousel';
import ImageTileGrid from './ImageTileGrid';
import { EMOTION_MAP } from '@/lib/constants/constants';
import { useMediaResolveMulti } from '@/hooks/useMediaResolve';
import { useState, useEffect, memo } from 'react';

type ImageLayout = 'carousel' | 'tile' | 'responsive';

const BlockContent = memo(function BlockContent({
  block,
  imageLayout = 'carousel',
}: {
  block: Block;
  imageLayout?: ImageLayout;
}) {
  if (!block.value) return null;

  switch (block.type) {
    case 'DATE':
      if ('date' in block.value) {
        return (
          <div className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {block.value.date}
          </div>
        );
      }
      return null;

    case 'TIME':
      if ('time' in block.value) {
        return (
          <div className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {block.value.time}
          </div>
        );
      }
      return null;

    case 'TEXT':
      if ('text' in block.value) {
        return (
          <p className="text-[13px] sm:text-[14px] leading-relaxed font-normal dark:text-gray-300 text-[#555555] whitespace-pre-wrap">
            {block.value.text}
          </p>
        );
      }
      return null;

    case 'TAG':
      if ('tags' in block.value && block.value.tags.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {block.value.tags.map((tag, index) => (
              <span
                key={index}
                className="text-[10px] sm:text-[11px] font-medium px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg dark:bg-white/5 bg-[#F9F9F9]"
              >
                <span className="text-[#10B981] font-bold mr-0.5">#</span>
                <span className="dark:text-gray-300 text-itta-black">
                  {tag}
                </span>
              </span>
            ))}
          </div>
        );
      }
      return null;

    case 'RATING':
      if ('rating' in block.value) {
        return (
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FACC15] fill-[#FACC15]" />
            <span className="text-[12px] sm:text-[13px] font-medium dark:text-gray-300 text-gray-600">
              {block.value.rating} / 5
            </span>
          </div>
        );
      }
      return null;

    case 'IMAGE':
      if ('mediaIds' in block.value || 'tempUrls' in block.value) {
        return (
          <ImageBlock value={block.value as ImageValue} layout={imageLayout} />
        );
      }
      return null;
    case 'LOCATION':
      if ('address' in block.value) {
        return (
          <div className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] font-medium dark:text-white/70 text-itta-black">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981]" />
            <span>{block.value.placeName || block.value.address}</span>
          </div>
        );
      }
      return null;

    case 'MOOD':
      if ('mood' in block.value) {
        return (
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-lg sm:text-xl leading-none flex justify-center items-center">
              {EMOTION_MAP[block.value.mood]}&nbsp;
              <span className="text-[11px] sm:text-xs ml-1">
                {block.value.mood}
              </span>
            </span>
          </div>
        );
      }
      return null;

    case 'TABLE':
      if ('cells' in block.value) {
        return (
          <div className="overflow-hidden rounded-lg sm:rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-transparent">
            <table className="w-full text-[11px] sm:text-[12px] border-collapse">
              <tbody>
                {block.value.cells.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      rowIndex === 0 && 'dark:bg-white/5 bg-gray-50/80',
                    )}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="p-1.5 pl-2 sm:p-2 sm:pl-3 border-b border-r border-black/3 dark:border-white/2 last:border-r-0 text-gray-500 dark:text-gray-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      return null;

    case 'MEDIA':
      if ('title' in block.value && 'type' in block.value) {
        return (
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-colors dark:bg-white/3 dark:border-white/5 bg-gray-50/50 border-gray-100">
            <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden shrink-0 bg-gray-100 border border-black/5">
              {block.value.imageUrl ? (
                <Image
                  src={block.value.imageUrl}
                  className="w-full h-full object-cover rounded shadow-sm"
                  alt={block.value.title}
                  width={56}
                  height={80}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Film className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {block.value.type}
              </p>
              <p className="text-[12px] sm:text-[13px] font-bold truncate dark:text-gray-200 text-gray-700">
                {block.value.title}
              </p>
              {block.value.year && (
                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                  {block.value.year}
                </p>
              )}
            </div>
          </div>
        );
      }
      return null;

    default:
      return null;
  }
});

export default BlockContent;

/**
 * 이미지 블록 처리하는 내부 컴포넌트
 * imageId를 통한 solve를 위해 분리
 */
const ImageBlock = memo(function ImageBlock({
  value,
  layout = 'carousel',
}: {
  value: ImageValue;
  layout?: ImageLayout;
}) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // responsive 모드일 때만 화면 크기 체크
    if (layout !== 'responsive') return;

    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [layout]);

  const { mediaIds = [], tempUrls = [], resolvedUrls = [] } = value;
  const shouldResolveOnClient =
    mediaIds.length > 0 && resolvedUrls.length === 0;

  const { data, isLoading } = useMediaResolveMulti(
    shouldResolveOnClient ? mediaIds : [],
  );

  const hookUrls = data?.items.map((item) => item.url) || [];

  const displayImages =
    resolvedUrls.length > 0
      ? resolvedUrls
      : hookUrls.length > 0
        ? hookUrls
        : tempUrls;

  if (displayImages.length === 0) return null;

  // 레이아웃 결정
  const shouldShowTile =
    layout === 'tile' || (layout === 'responsive' && isDesktop);

  return (
    <div
      className={cn('relative w-full', isLoading && 'opacity-70 animate-pulse')}
    >
      {shouldShowTile ? (
        <ImageTileGrid images={displayImages} />
      ) : (
        <ImageCarousel images={displayImages} />
      )}
    </div>
  );
});
