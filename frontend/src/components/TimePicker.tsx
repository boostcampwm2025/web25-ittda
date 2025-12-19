'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ScrollColumn from './ScrollColumn';

const HOURS = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, '0'),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, '0'),
);
const PERIODS = ['오전', '오후'];

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

const parseValue = (value: string) => {
  if (!value) return { p: '오전', h: '12', m: '00' };
  try {
    const [p, time] = value.split(' ');
    const [h, m] = time.split(':');
    return { p, h, m };
  } catch (e) {
    return { p: '오전', h: '12', m: '00' };
  }
};

export function TimePicker({ value, onChange }: TimePickerProps) {
  const { p: periodPart, h: hourPart, m: minutePart } = parseValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="outline-none font-medium cursor-pointer min-w-20">
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto bg-white shadow-xl border-gray-200 relative"
        align="start"
      >
        <div className="flex items-center">
          {/* 하이라이트 배경 바 */}
          <div className="absolute top-1/2 left-1 right-1 h-9 -translate-y-1/2 bg-gray-100 z-0 pointer-events-none rounded" />

          <ScrollColumn
            list={PERIODS}
            current={periodPart}
            onValueChange={(v) => onChange(`${v} ${hourPart}:${minutePart}`)}
          />
          <ScrollColumn
            list={HOURS}
            current={hourPart}
            onValueChange={(v) => onChange(`${periodPart} ${v}:${minutePart}`)}
          />
          <ScrollColumn
            list={MINUTES}
            current={minutePart}
            onValueChange={(v) => onChange(`${periodPart} ${hourPart}:${v}`)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
