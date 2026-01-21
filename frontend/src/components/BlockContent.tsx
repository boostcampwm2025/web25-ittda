import { Block } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import ImageCarousel from './ImageCarousel';
import { EMOTION_MAP } from '@/lib/constants/constants';

export default function BlockContent({ block }: { block: Block }) {
  if (!block.value) return null;

  switch (block.type) {
    case 'DATE':
      if ('date' in block.value) {
        return (
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            {block.value.date}
          </div>
        );
      }
      return null;

    case 'TIME':
      if ('time' in block.value) {
        return (
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            {block.value.time}
          </div>
        );
      }
      return null;

    case 'TEXT':
      if ('text' in block.value) {
        return (
          <p className="text-[15px] leading-relaxed font-normal dark:text-gray-300 text-[#555555] whitespace-pre-wrap">
            {block.value.text}
          </p>
        );
      }
      return null;

    case 'TAG':
      if ('tags' in block.value && block.value.tags.length > 0) {
        return (
          <div className="flex flex-wrap gap-1.5">
            {block.value.tags.map((tag, index) => (
              <span
                key={index}
                className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg dark:bg-white/5 bg-[#F9F9F9]"
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
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-[#FACC15] fill-[#FACC15]" />
            <span className="text-[13px] font-medium dark:text-gray-300 text-gray-600">
              {block.value.rating} / 5
            </span>
          </div>
        );
      }
      return null;

    case 'IMAGE':
      if ('tempUrls' in block.value || 'mediaIds' in block.value) {
        const images = block.value.tempUrls || [];
        if (images.length > 0) {
          return <ImageCarousel images={images} />;
        }
      }
      return null;

    case 'LOCATION':
      if ('address' in block.value) {
        return (
          <div className="flex items-center gap-1.5 text-[13px] font-medium dark:text-white/70 text-itta-black">
            <MapPin className="w-4 h-4 text-[#10B981]" />
            <span>{block.value.placeName || block.value.address}</span>
          </div>
        );
      }
      return null;

    case 'MOOD':
      if ('mood' in block.value) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none flex justify-center items-center">
              {EMOTION_MAP[block.value.mood]}&nbsp;
              <span className="text-sm ml-2">{block.value.mood}</span>
            </span>
          </div>
        );
      }
      return null;

    case 'TABLE':
      if ('cells' in block.value) {
        return (
          <div className="overflow-hidden rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-transparent">
            <table className="w-full text-[12px] border-collapse">
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
                        className="p-2 pl-3 border-b border-r border-black/3 dark:border-white/2 last:border-r-0 text-gray-500 dark:text-gray-300"
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
          <div className="flex items-center gap-3 p-4 rounded-xl border transition-colors dark:bg-white/3 dark:border-white/5 bg-gray-50/50 border-gray-100">
            {block.value.imageUrl && (
              <Image
                src={block.value.imageUrl}
                className="w-12 h-16 object-cover rounded shadow-sm"
                alt={block.value.title}
                width={50}
                height={50}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {block.value.type}
              </p>
              <p className="text-[13px] font-bold truncate dark:text-gray-200 text-gray-700">
                {block.value.title}
              </p>
              {block.value.year && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
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
}
