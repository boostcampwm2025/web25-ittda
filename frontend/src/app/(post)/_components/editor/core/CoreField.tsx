'use client';
import { getWeekdayFromDotString } from '@/lib/date';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

interface DateProps {
  date: string;
  onClick: () => void;
}

export const DateField = ({ date, onClick }: DateProps) => {
  const dayName = getWeekdayFromDotString(date);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-bold text-xs text-itta-black dark:text-gray-300 active:scale-95 transition-transform"
    >
      <Calendar className="w-3.5 h-3.5 text-itta-point" />
      {date}. ({dayName}) <ChevronDown className="w-3 h-3 text-gray-400" />
    </button>
  );
};
interface TimeProps {
  time: string;
  onClick: () => void;
}

export const TimeField = ({ time, onClick }: TimeProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 font-bold text-xs text-itta-black dark:text-gray-300 active:scale-95 transition-transform"
  >
    <Clock className="w-3.5 h-3.5 text-itta-point" />
    {time} <ChevronDown className="w-3 h-3 text-gray-400" />
  </button>
);

interface ContentProps {
  value: string;
  onChange: (val: string) => void;
}

export const ContentField = ({ value, onChange }: ContentProps) => (
  <div className="relative pl-3 w-full group/content">
    <div className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-full bg-gray-200 dark:bg-white/10 group-focus-within/content:bg-itta-point transition-colors duration-300" />
    <textarea
      placeholder="어떤 기억이 있으신가요?"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[120px] border-none focus:ring-0 outline-none text-md leading-relaxed tracking-tight resize-none p-1 overflow-hidden bg-transparent text-itta-black dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-700"
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }}
    />
  </div>
);
