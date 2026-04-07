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
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useIMEInput } from '@/hooks/useIMEInput';
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
  onBlur?: (finalText: string) => void;
  onLockedClick?: () => void;
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
  onLockedClick,
}: ContentProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imeProps = useIMEInput(onChange);
  const isInternalFocus = useRef(false);

  useEffect(() => {
    if (isMyLock && textareaRef.current) {
      if (document.activeElement === textareaRef.current) return;
      isInternalFocus.current = true;
      textareaRef.current.focus();

      //포커스 시 커서 맨 뒤로
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isMyLock]);

  const handleFocusWrapper = () => {
    if (isInternalFocus.current) {
      isInternalFocus.current = false;
      return;
    }

    onFocus?.();
  };

  const adjustHeight = useCallback(() => {
    const target = textareaRef.current;
    if (!target) return;
    // height: auto 로 먼저 줄이면 스크롤 컨테이너가 위로 점프하는 문제가 발생.
    // scrollHeight는 overflow:hidden 상태에서도 콘텐츠 전체 높이를 반환하므로
    // 현재 높이보다 커질 때만 늘리고, 줄어들 때는 height: auto 후 재측정.
    requestAnimationFrame(() => {
      const newHeight = target.scrollHeight;
      if (newHeight > target.offsetHeight) {
        // 콘텐츠가 늘어난 경우: 높이만 확장 후 커서가 보이도록 스크롤
        target.style.height = `${newHeight}px`;
        // 커서 위치를 뷰포트 안으로 부드럽게 스크롤
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        // 콘텐츠가 줄어든 경우: 스크롤 위치 저장 후 복원
        const scrollEl = target.closest('[data-radix-scroll-area-viewport]') ??
          target.parentElement?.closest('[style*="overflow"]') ??
          document.scrollingElement;
        const savedScroll = scrollEl?.scrollTop ?? 0;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        if (scrollEl) scrollEl.scrollTop = savedScroll;
      }
    });
  }, []);

  // value 변경될 때 높이 조절
  useLayoutEffect(() => {
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

  const handleBlur = () => {
    if (textareaRef.current) {
      onBlur?.(textareaRef.current.value);
    }
  };

  return (
    <div
      className={cn(
        'flex relative items-center gap-2 w-full group/content transition-opacity',
        isLocked && 'opacity-60',
      )}
    >
      {isLocked && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onLockedClick?.();
          }}
          className="absolute inset-0 z-10"
        />
      )}
      <div className="relative flex-1 pl-3">
        <div className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-full bg-gray-200 dark:bg-white/10 group-focus-within/content:bg-itta-point dark:group-focus-within/content:bg-itta-point transition-colors duration-300" />

        <textarea
          ref={textareaRef}
          spellCheck="false"
          rows={1}
          placeholder="어떤 기억이 있으신가요?"
          value={value.text}
          disabled={isLocked}
          onFocus={handleFocusWrapper}
          onBlur={handleBlur}
          {...imeProps}
          className="w-full h-auto border-none focus:ring-0 outline-none text-base leading-relaxed tracking-tight resize-none p-1 overflow-hidden bg-transparent text-itta-black dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-500"
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
