'use client';

import { Clock, MapPin } from 'lucide-react';
import { PostCard } from './PostCard';
import { useRouter } from 'next/navigation';

/**
 * MonthRecordCard - 월별 기록 카드
 * 날짜 뱃지, 제목, 위치 정보를 표시하는 카드
 */
export interface RecordCardProps {
  id: string;
  name: string;
  count: number | string;
  latestTitle: string;
  latestLocation: string;
  coverUrl?: string | null;
  hasNotification?: boolean;
  onClick?: () => void;
  onChangeCover?: (id: string) => void;
}

export function RecordCard({
  id,
  name,
  count,
  latestTitle,
  latestLocation,
  coverUrl,
  hasNotification,
  onClick,
  onChangeCover,
}: RecordCardProps) {
  return (
    <PostCard imageUrl={coverUrl} imageAlt={name} onClick={onClick}>
      {/* 커버 변경 버튼 */}
      {onChangeCover && (
        <PostCard.Action
          label="커버 변경"
          onClick={(e) => {
            e.stopPropagation();
            onChangeCover(id);
          }}
        />
      )}

      {/* 카드 콘텐츠 */}
      <PostCard.Overlay>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <PostCard.Title className="flex justify-start items-center gap-1.5">
            {name} {hasNotification && <PostCard.Notification />}
          </PostCard.Title>

          <PostCard.Badge>{count}</PostCard.Badge>
        </div>
        <div className="space-y-0.5">
          <PostCard.Description>{latestTitle}</PostCard.Description>
          <PostCard.Meta
            icon={
              <MapPin
                className="w-2.5 h-2.5 text-[#10B981]"
                strokeWidth={2.5}
              />
            }
          >
            {latestLocation}
          </PostCard.Meta>
        </div>
      </PostCard.Overlay>
    </PostCard>
  );
}

/**
 * DateRecordCard - 날짜 기록 카드
 * 날짜 뱃지, 제목, 부제목을 표시하는 카드
 */
export interface DateRecordCardProps {
  date: string;
  dayName: string;
  title: string;
  count?: number;
  coverUrl?: string | null;
  onClick?: () => void;
  routePath?: string;
  icon?: React.ReactNode;
}

export function DateRecordCard({
  date,
  dayName,
  title,
  count,
  coverUrl,
  onClick,
  routePath,
  icon,
}: DateRecordCardProps) {
  const router = useRouter();

  return (
    <PostCard
      imageUrl={coverUrl}
      imageAlt={title}
      onClick={() => {
        if (routePath) {
          router.push(routePath);
        }
        onClick?.();
      }}
    >
      {/* 날짜 뱃지 - 왼쪽 상단 */}
      <div className="absolute top-3 left-3 z-10">
        <div className="px-2.5 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center">
          <span className="text-[14px] font-semibold text-white leading-none">
            {date.split('-')[2]}
          </span>
          <span className="text-[8px] font-bold text-white/60 uppercase tracking-tighter mt-0.5">
            {dayName}
          </span>
        </div>
      </div>

      {/* 카드 콘텐츠 */}
      <PostCard.Overlay>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon}
            <PostCard.Title className="text-[15px]">{title}</PostCard.Title>
          </div>
          <div className="flex items-center gap-1.5 text-white/80 text-[9px]">
            <Clock className="w-2.5 h-2.5 text-[#10B981]" strokeWidth={2.5} />
            <span className="truncate">일별 기록 보기</span>
            <span className="text-[7px]">•</span>
            <PostCard.Meta>
              <span className="text-[#10B981] font-bold">기록 {count}개</span>
            </PostCard.Meta>
          </div>
        </div>
      </PostCard.Overlay>
    </PostCard>
  );
}

/**
 * SimpleRecordCard - 간단한 기록 카드
 * 제목과 설명만 표시하는 심플한 카드
 */
export interface SimpleRecordCardProps {
  title: string;
  description?: string;
  coverUrl?: string | null;
  badge?: string;
  onClick?: () => void;
  height?: string;
}

export function SimpleRecordCard({
  title,
  description,
  coverUrl,
  badge,
  onClick,
  height,
}: SimpleRecordCardProps) {
  return (
    <PostCard
      imageUrl={coverUrl}
      imageAlt={title}
      onClick={onClick}
      height={height}
    >
      <PostCard.Overlay>
        <div className="flex items-center justify-between">
          <PostCard.Title>{title}</PostCard.Title>
          {badge && <PostCard.Badge>{badge}</PostCard.Badge>}
        </div>
        {description && (
          <PostCard.Description>{description}</PostCard.Description>
        )}
      </PostCard.Overlay>
    </PostCard>
  );
}
