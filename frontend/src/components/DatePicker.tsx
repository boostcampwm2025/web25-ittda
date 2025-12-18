import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDateDot } from '@/lib/date';
import { ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="outline-none font-medium cursor-pointer min-w-20 flex justify-center items-center gap-1.25">
          <span>{formatDateDot(value)}</span>
          <ChevronDown color="var(--itta-black)" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto bg-white shadow-xl border-gray-200 relative"
        align="start"
      >
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          className="text-itta-black"
          onSelect={(date) => {
            onChange(date || new Date());
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
