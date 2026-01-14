import { FieldType, MemoryRecord } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import Image from 'next/image';

type CompactFieldRendererProps = {
  [K in FieldType]: {
    type: K;
    data: MemoryRecord['data'][K];
    isDetail?: boolean;
  };
}[FieldType];

export default function CompactFieldRenderer({
  type,
  data,
  isDetail,
}: CompactFieldRendererProps) {
  if (!data) return null;
  switch (type) {
    case 'emotion':
      return (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl leading-none">{data.emoji}</span>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {data.label}
          </span>
        </div>
      );
    case 'photos':
      return (
        data.length > 0 && (
          <div className="w-full rounded-xs overflow-hidden mb-4">
            <Image
              src={data[0]}
              className="w-full h-auto"
              alt=""
              // placeholder="blur"
              // blurDataURL=''
              width={800}
              height={800}
            />
          </div>
        )
      );
    case 'location':
      return (
        <div className="flex items-center gap-1.5 text-[11px] font-medium mb-3 dark:text-white/70 text-itta-black">
          <MapPin className="w-3 h-3 text-[#10B981]" />
          <span>{data}</span>
        </div>
      );
    case 'rating':
      return (
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
          <span className="text-[11px] font-medium dark:text-gray-300 text-gray-600">
            {data.value.toFixed(1)} / {data.max}
          </span>
        </div>
      );
    case 'content':
      return (
        <p className="text-[13px] leading-relaxed font-normal mb-4 line-clamp-2 dark:text-gray-300 text-[#555555]">
          {data}
        </p>
      );
    case 'tags':
      return (
        data.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.map((tag: string) => (
              <span
                key={tag}
                className="text-[9px] font-medium px-2 py-1 rounded-lg dark:bg-white/5 bg-[#F9F9F9]"
              >
                <span className="text-[#10B981] font-bold mr-0.5">#</span>
                <span className="dark:text-gray-300 text-itta-black">
                  {tag}
                </span>
              </span>
            ))}
          </div>
        )
      );
    case 'table':
      return (
        <div className="mb-4 overflow-hidden rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-transparent">
          <table className="w-full text-[10px] border-collapse">
            <tbody>
              {(isDetail ? data.slice(0, 3) : data).map(
                (row: string[], i: number) => (
                  <tr
                    key={i}
                    className={cn(i === 0 && 'dark:bg-white/5 bg-gray-50/80')}
                  >
                    {row.map((cell: string, j: number) => (
                      <td
                        key={j}
                        className="p-1.5 pl-3 border-b border-r border-black/3 dark:border-white/2 last:border-r-0 truncate max-w-25 text-gray-500 dark:text-gray-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      );
    case 'media':
      return (
        <div className="flex items-center gap-3 p-3 rounded-xl border mb-4 transition-colors dark:bg-white/3 dark:border-white/5 bg-gray-50/50 border-gray-100">
          <Image
            src={data.image}
            className="w-8 h-10 object-cover rounded shadow-sm"
            alt=""
            placeholder="blur"
            width={50}
            height={50}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {data.type}
            </p>
            <p className="text-[11px] font-bold truncate dark:text-gray-200 text-gray-700">
              {data.title}
            </p>
          </div>
        </div>
      );
    case 'date':
      return (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-medium text-gray-400 dark:text-gray-300">
          <Calendar className="w-3 h-3" />
          {data}
        </div>
      );
    case 'time':
      return (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-medium text-gray-400 dark:text-gray-300">
          <Clock className="w-3 h-3" />
          {data}
        </div>
      );
    default:
      return null;
  }
}
