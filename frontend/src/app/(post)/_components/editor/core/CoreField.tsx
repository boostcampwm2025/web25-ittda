'use client';
import {
  formatDateDot,
  formatDateISO,
  getWeekdayFromDotString,
} from '@/lib/date';
import { convertTo12Hour } from '@/lib/utils/time';
import { Calendar, ChevronDown, Clock } from 'lucide-react';
import { FieldDeleteButton } from './FieldDeleteButton';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef } from 'react';
import { DateValue, TextValue, TimeValue } from '@/lib/types/record';

interface DateProps {
  date: DateValue;
  onClick: () => void;
}

export const DateField = ({ date, onClick }: DateProps) => {
  const isDefault = !date.date;
  // 기본값 생성
  const targetDate = isDefault ? formatDateISO(new Date()) : date.date;

  const formattedDate = formatDateDot(new Date(targetDate));
  const dayName = getWeekdayFromDotString(formattedDate);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-bold text-xs text-itta-black dark:text-gray-300 active:scale-95 transition-transform"
    >
      <Calendar className="w-3.5 h-3.5 text-itta-point" />
      {formattedDate}. ({dayName}){' '}
      <ChevronDown className="w-3 h-3 text-gray-400" />
    </button>
  );
};
interface TimeProps {
  time: TimeValue;
  onClick: () => void;
}

export const TimeField = ({ time, onClick }: TimeProps) => {
  let targetTime = time.time;

  // 기본값 생성
  if (!targetTime || !targetTime.includes(':')) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    targetTime = `${hours}:${minutes}`;
  }

  const formattedTime = convertTo12Hour(targetTime);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-bold text-xs text-itta-black dark:text-gray-300 active:scale-95 transition-transform"
    >
      <Clock className="w-3.5 h-3.5 text-itta-point" />
      {formattedTime} <ChevronDown className="w-3 h-3 text-gray-400" />
    </button>
  );
};

interface ContentProps {
  value: TextValue;
  onChange: (val: string) => void;
  onRemove: () => void;
  isLastContentBlock: boolean;
  isLocked?: boolean;
  isMyLock?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ContentField = ({
  value,
  onChange,
  onRemove,
  isLastContentBlock,
  isLocked,
  isMyLock,
  onFocus,
  onBlur,
}: ContentProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInternalFocus = useRef(false);

  useEffect(() => {
    if (isMyLock && textareaRef.current) {
      isInternalFocus.current = true;
      textareaRef.current.focus();

      //포커스 시 커서 맨 뒤로
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isMyLock]);

  const handleFocusWrapper = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (isInternalFocus.current) {
      isInternalFocus.current = false;
      return;
    }

    onFocus?.();
  };

  const adjustHeight = useCallback(() => {
    const target = textareaRef.current;
    // 현재 텍스트 크기에 맞게 높이 조절
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
  }, []);

  // value 변경될 때 높이 조절
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // 너비 변경될 때 높이 조절
  useEffect(() => {
    const target = textareaRef.current;
    if (!target) return;

    // ResizeObserver를 통해 textarea의 크기 변화 관찰
    const observer = new ResizeObserver(() => {
      adjustHeight();
    });

    observer.observe(target);

    return () => observer.disconnect();
  }, [adjustHeight]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 w-full group/content transition-opacity',
        isLocked && 'opacity-60 pointer-events-none',
      )}
    >
      <div className="relative flex-1 pl-3">
        <div className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-full bg-gray-200 dark:bg-white/10 group-focus-within/content:bg-itta-point dark:group-focus-within/content:bg-itta-point transition-colors duration-300" />

        <textarea
          ref={textareaRef}
          placeholder="어떤 기억이 있으신가요?"
          value={value.text}
          disabled={isLocked}
          onFocus={handleFocusWrapper}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-30 border-none focus:ring-0 outline-none text-md leading-relaxed tracking-tight resize-none p-1 overflow-hidden bg-transparent text-itta-black dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-500"
        />
      </div>
      {!isLastContentBlock && (
        <div className="shrink-0 flex items-center justify-center mr-4">
          <FieldDeleteButton onRemove={onRemove} ariaLabel="텍스트 필드 삭제" />
        </div>
      )}
    </div>
  );
};
