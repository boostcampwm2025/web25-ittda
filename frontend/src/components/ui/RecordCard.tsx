'use client';

import { MapPin } from 'lucide-react';
import { PostCard } from './PostCard';

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
        <div className="flex items-center justify-between">
          <PostCard.Title className="flex justify-start items-center gap-2">
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
  day: string;
  title: string;
  subtitle?: string;
  count?: number;
  coverUrl?: string | null;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function DateRecordCard({
  date,
  day,
  title,
  subtitle,
  count,
  coverUrl,
  onClick,
  icon,
}: DateRecordCardProps) {
  return (
    <PostCard imageUrl={coverUrl} imageAlt={title} onClick={onClick}>
      {/* 날짜 뱃지 - 왼쪽 상단 */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-white/90 dark:bg-black/60 backdrop-blur-md shadow-lg">
          <span className="text-[20px] font-bold text-itta-black dark:text-white leading-none">
            {date}
          </span>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            {day}
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
          {subtitle && <PostCard.Description>{subtitle}</PostCard.Description>}
          {count !== undefined && (
            <PostCard.Meta>
              <span className="text-[#10B981] font-bold">기록 {count}개</span>
            </PostCard.Meta>
          )}
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
