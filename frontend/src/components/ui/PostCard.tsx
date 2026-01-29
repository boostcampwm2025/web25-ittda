'use client';

import { ImageIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AssetImage from '../AssetImage';

export interface BaseCardProps {
  onClick?: () => void;
  height?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  className?: string;
  children: ReactNode;
}

export interface CardOverlayProps {
  children: ReactNode;
  position?: 'top' | 'bottom' | 'center';
  className?: string;
}

export interface CardActionProps {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export interface CardBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'outline';
  className?: string;
}

/**
 * PostCard - 재사용 가능한 카드 베이스 컴포넌트
 *
 * @example
 * ```tsx
 * <PostCard imageUrl={coverUrl} onClick={handleClick}>
 *   <PostCard.Overlay>
 *     <div>카드 콘텐츠</div>
 *   </PostCard.Overlay>
 *   <PostCard.Action label="편집" onClick={handleEdit} />
 * </PostCard>
 * ```
 */
export function PostCard({
  onClick,
  height = 'h-50',
  imageUrl,
  imageAlt = '',
  className = '',
  children,
}: BaseCardProps) {
  return (
    <div className={`group relative ${height}`}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClick?.();
        }}
        onClick={onClick}
        className={cn(
          'cursor-pointer w-full h-full rounded-2xl overflow-hidden relative shadow-sm active:scale-[0.98] transition-all flex flex-col justify-end text-left border dark:border-white/5 dark:bg-[#1E1E1E] border-gray-100 bg-gray-50',
          className,
        )}
      >
        {imageUrl ? (
          <AssetImage
            assetId={imageUrl}
            alt={imageAlt}
            width={100}
            height={100}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 dark:opacity-60 opacity-90"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full dark:bg-linear-to-br dark:from-[#10B981]/20 dark:to-[#121212] bg-linear-to-br from-[#10B981]/10 to-white" />
        )}

        {/* 그라디언트 오버레이 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />

        {/* 자식 컴포넌트 렌더링 */}
        {children}
      </div>

      {/* 이미지가 없을 때 플레이스홀더 아이콘 */}
      {!imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  );
}

PostCard.Overlay = function CardOverlay({
  children,
  position = 'bottom',
  className = '',
}: CardOverlayProps) {
  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0',
    center: 'top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className={cn(
        'relative z-10 p-4 w-full space-y-1',
        positionClasses[position],
        className,
      )}
    >
      {children}
    </div>
  );
};

PostCard.Action = function CardAction({
  label,
  onClick,
  position = 'top-right',
  className = '',
}: CardActionProps) {
  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        'absolute px-2.5 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white text-[9px] font-bold hover:bg-black/60 transition-colors active:scale-95 cursor-pointer',
        positionClasses[position],
        className,
      )}
    >
      {label}
    </button>
  );
};

PostCard.Badge = function CardBadge({
  children,
  variant = 'default',
  className = '',
}: CardBadgeProps) {
  const variantClasses = {
    default: 'bg-white/20 backdrop-blur-md border border-white/20 text-white',
    accent: 'bg-[#10B981]/90 text-white border border-[#10B981]',
    outline: 'bg-transparent border border-white/40 text-white',
  };

  return (
    <div
      className={cn(
        'px-2 py-0.5 rounded-lg text-[8px] font-bold shrink-0',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
};

PostCard.Notification = function Notification({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={cn(
        'w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0',
        className,
      )}
    />
  );
};

PostCard.Title = function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        'text-white text-[13px] font-bold tracking-tight truncate',
        className,
      )}
    >
      {children}
    </h3>
  );
};

PostCard.Description = function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-white/90 text-[11px] font-medium truncate',
        className,
      )}
    >
      {children}
    </p>
  );
};

PostCard.Meta = function CardMeta({
  icon,
  children,
  className = '',
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-white/50 text-[9px]',
        className,
      )}
    >
      {icon}
      <span className="truncate text-white/90">{children}</span>
    </div>
  );
};
