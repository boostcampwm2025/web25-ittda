'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface PendingJump {
  date: string;
  nonce: number;
}

interface RecordTimelineContextValue {
  activeDate: string;
  pendingJump: PendingJump | null;
  isJumping: boolean;
  requestJump: (date: string) => void;
  reportScrollActiveDate: (date: string) => void;
  reportJumpSettled: () => void;
}

const RecordTimelineContext = createContext<RecordTimelineContextValue | null>(
  null,
);

// 캘린더(WeekCalendar)와 연속 피드(RecordTimelineFeed)가 공유하는 "현재 보고
// 있는 날짜" 상태. 스크롤이 날짜를 바꾸면(reportScrollActiveDate) 캘린더가
// 따라 움직이고, 캘린더 탭이 날짜를 바꾸면(requestJump) 피드가 그 위치로
// 스크롤한다. isJumping은 점프 스크롤이 진행되는 동안 스크롤 관찰값이
// activeDate를 되돌리는 피드백 루프를 막기 위한 가드.
export function RecordTimelineProvider({
  initialDate,
  children,
}: {
  initialDate: string;
  children: React.ReactNode;
}) {
  const [activeDate, setActiveDate] = useState(initialDate);
  const [pendingJump, setPendingJump] = useState<PendingJump | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const nonceRef = useRef(0);

  // ref로도 미러링: reportScrollActiveDate를 isJumping 값이 바뀔 때마다
  // 재생성하지 않기 위함(IntersectionObserver 재구성 방지, 안정된 identity 유지).
  const isJumpingRef = useRef(isJumping);
  useEffect(() => {
    isJumpingRef.current = isJumping;
  }, [isJumping]);

  const requestJump = useCallback((date: string) => {
    nonceRef.current += 1;
    setActiveDate(date);
    setIsJumping(true);
    setPendingJump({ date, nonce: nonceRef.current });
  }, []);

  const reportScrollActiveDate = useCallback((date: string) => {
    if (isJumpingRef.current) return;
    setActiveDate(date);
  }, []);

  const reportJumpSettled = useCallback(() => {
    setIsJumping(false);
  }, []);

  return (
    <RecordTimelineContext.Provider
      value={{
        activeDate,
        pendingJump,
        isJumping,
        requestJump,
        reportScrollActiveDate,
        reportJumpSettled,
      }}
    >
      {children}
    </RecordTimelineContext.Provider>
  );
}

export function useRecordTimeline() {
  const ctx = useContext(RecordTimelineContext);
  if (!ctx) {
    throw new Error(
      'useRecordTimeline은 RecordTimelineProvider 내부에서만 사용할 수 있습니다.',
    );
  }
  return ctx;
}
