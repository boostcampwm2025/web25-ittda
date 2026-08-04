'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { pastFeedInfiniteOptions } from '@/lib/api/records';
import {
  formatDateDot,
  formatDateISO,
  getWeekdayFromDotString,
  parseLocalDate,
} from '@/lib/date';
import { RecordPreview } from '@/lib/types/recordResponse';
import RecordItem from './RecordItem';
import RecordOnboardingEmpty from './RecordOnboardingEmpty';
import { RecordItemSkeleton } from './HomePageSkeleton';
import { useRecordTimeline } from './RecordTimelineProvider';

interface RecordTimelineFeedProps {
  groupId?: string;
  imageLayout: 'carousel' | 'tile' | 'responsive';
}

type TimelineRow =
  | { type: 'divider'; dateKey: string; isToday: boolean }
  | { type: 'record'; record: RecordPreview };

function formatDividerLabel(dateKey: string, isToday: boolean): string {
  const date = parseLocalDate(dateKey);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = getWeekdayFromDotString(formatDateDot(date));
  const base = `${month}월 ${day}일 · ${weekday}요일`;
  return isToday ? `오늘 · ${base}` : base;
}

const waitForNextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

// 개인/그룹 홈의 "탭해서 필터" 리스트(RecordList)를 대체하는 연속 타임라인
// 피드. pastFeedInfiniteOptions로 과거 기록을 최신순 무한스크롤하며, 날짜가
// 바뀔 때마다 구분선을 끼워 넣는다. "오늘" 구분선은 오늘 기록 유무와
// 무관하게 항상 최상단에 표시된다. RecordTimelineProvider의 activeDate와
// 연동해 캘린더 탭 시 해당 날짜로 점프한다(스크롤→캘린더 동기화는 별도 단계).
export default function RecordTimelineFeed({
  groupId,
  imageLayout,
}: RecordTimelineFeedProps) {
  const router = useRouter();
  const { pendingJump, reportJumpSettled, reportScrollActiveDate } =
    useRecordTimeline();
  const today = formatDateISO();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    refetch,
  } = useInfiniteQuery(pastFeedInfiniteOptions(groupId));

  const records = useMemo(() => {
    const seen = new Set<string>();
    const result: RecordPreview[] = [];
    (data?.pages ?? []).forEach((page) => {
      page.items.forEach((item) => {
        if (seen.has(item.postId)) return;
        seen.add(item.postId);
        result.push(item);
      });
    });
    return result;
  }, [data]);

  const rows = useMemo<TimelineRow[]>(() => {
    const result: TimelineRow[] = [
      { type: 'divider', dateKey: today, isToday: true },
    ];
    let lastKey = today;
    records.forEach((record) => {
      const dateKey = record.eventAt.split('T')[0];
      if (dateKey !== lastKey) {
        result.push({ type: 'divider', dateKey, isToday: false });
        lastKey = dateKey;
      }
      result.push({ type: 'record', record });
    });
    return result;
  }, [records, today]);

  // 날짜 구분선 DOM — 탭→점프 스크롤 대상 조회, 스크롤→캘린더 동기화 둘 다에 쓰인다.
  const dividerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerDividerRef = useCallback(
    (dateKey: string) => (node: HTMLDivElement | null) => {
      if (node) dividerRefs.current.set(dateKey, node);
      else dividerRefs.current.delete(dateKey);
    },
    [],
  );

  const syncActiveDate = useCallback(() => {
    // 기준선은 WeekCalendar가 실제로 화면을 가리는 하단 경계 — 헤더가
    // 보였다 숨었다 하고 브레이크포인트별로 캘린더 높이가 달라서 고정값을
    // 쓰면 구분선이 이미 화면에 드러났는데도 한참 뒤에야(캘린더 밑에서
    // 거의 다 가려질 때) 활성 날짜로 인식되는 문제가 있었다.
    const calendarEl = document.getElementById('week-calendar-sticky');
    const referenceY = calendarEl
      ? calendarEl.getBoundingClientRect().bottom
      : 96;
    let closestKey: string | null = null;
    let closestDistance = Infinity;

    dividerRefs.current.forEach((node, dateKey) => {
      const top = node.getBoundingClientRect().top;
      const distance = Math.abs(referenceY - top);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestKey = dateKey;
      }
    });

    if (closestKey) reportScrollActiveDate(closestKey);
  }, [reportScrollActiveDate]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        syncActiveDate();
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    syncActiveDate();

    // 탭/앱을 전환했다가 돌아오면(특히 iOS WebView) 스크롤 이벤트가 곧바로
    // 재계산되지 않는 경우가 있어, 화면이 다시 보이는 시점에도 재동기화한다.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncActiveDate();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', syncActiveDate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', syncActiveDate);
    };
  }, [syncActiveDate]);

  // 페이지네이션 트리거 — MonthRecordsInfinite와 동일한 패턴.
  const paginationObserverRef = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (paginationObserverRef.current)
        paginationObserverRef.current.disconnect();

      paginationObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isError) {
            fetchNextPage();
          }
        },
        { rootMargin: '200px' },
      );

      if (node) paginationObserverRef.current.observe(node);
    },
    [isFetchingNextPage, isError, hasNextPage, fetchNextPage],
  );

  // 탭→점프: 아직 로드 안 된 날짜면 필요한 만큼 다음 페이지를 추가로 불러온
  // 뒤 스크롤하고, 그 날짜에 기록이 없다고 확정되면 가장 가까운 이전 날짜로.
  useEffect(() => {
    if (!pendingJump) return;
    let cancelled = false;

    const collectDateKeys = (pages: { items: RecordPreview[] }[]) => {
      const keys = new Set<string>([today]);
      pages.forEach((page) =>
        page.items.forEach((item) => keys.add(item.eventAt.split('T')[0])),
      );
      return keys;
    };

    const performJump = async () => {
      const targetDate = pendingJump.date;
      let pages = data?.pages ?? [];
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const keys = collectDateKeys(pages);
        if (keys.has(targetDate)) break;

        const loadedDatesAsc = Array.from(keys).sort();
        const oldestLoaded = loadedDatesAsc[0];
        const lastPage = pages[pages.length - 1];
        const noMorePages = !lastPage || !lastPage.nextCursor;
        if ((oldestLoaded && oldestLoaded <= targetDate) || noMorePages) {
          break;
        }

        attempts += 1;
        const result = await fetchNextPage();
        if (cancelled) return;
        pages = result.data?.pages ?? pages;
      }

      const finalKeys = collectDateKeys(pages);
      const resolvedDate = finalKeys.has(targetDate)
        ? targetDate
        : Array.from(finalKeys)
            .filter((d) => d <= targetDate)
            .sort()
            .reverse()[0];

      if (!resolvedDate || cancelled) return;

      await waitForNextFrame();
      if (cancelled) return;
      dividerRefs.current
        .get(resolvedDate)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    performJump().finally(() => {
      if (!cancelled) reportJumpSettled();
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingJump?.nonce]);

  if (isPending) {
    return (
      <div className="space-y-3 sm:space-y-4 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <RecordItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError && records.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          기록을 불러오지 못했어요
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold text-white bg-itta-black"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (records.length === 0 && !hasNextPage) {
    return <RecordOnboardingEmpty groupId={groupId} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {rows.map((row, index) => {
        const isLastRow = index === rows.length - 1;
        const refProp = isLastRow ? lastRowRef : undefined;

        if (row.type === 'divider') {
          return (
            <div
              key={`divider-${row.dateKey}`}
              data-date-key={row.dateKey}
              ref={(node) => {
                registerDividerRef(row.dateKey)(node);
                refProp?.(node);
              }}
              className="flex items-center gap-2 px-0.5 sm:px-1"
            >
              <span
                className={
                  row.isToday
                    ? 'text-[11px] sm:text-[12px] font-bold text-itta-point'
                    : 'text-[11px] sm:text-[12px] font-bold text-gray-400 dark:text-gray-500'
                }
              >
                {formatDividerLabel(row.dateKey, row.isToday)}
              </span>
              <span className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
            </div>
          );
        }

        return (
          <div key={row.record.postId} ref={refProp}>
            <RecordItem
              record={row.record}
              imageLayout={imageLayout}
              isFirst={index === 1}
              onClick={() => {
                const recordGroupId =
                  groupId ??
                  (row.record.scope === 'GROUP'
                    ? row.record.groupId
                    : undefined);
                router.push(
                  recordGroupId
                    ? `/record/${row.record.postId}?scope=group&groupId=${recordGroupId}`
                    : `/record/${row.record.postId}`,
                );
              }}
            />
          </div>
        );
      })}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-itta-point" />
        </div>
      )}
    </div>
  );
}
