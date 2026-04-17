'use client';

import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AssetImageProps extends Omit<ImageProps, 'src'> {
  assetId: string; // solve 해야할 ID
  url?: string; // 직접 solve 완료한 URL
  fallback?: React.ReactNode;
  wrapperClassName?: string; // 스켈레톤 wrapper에 적용할 클래스 (fill 사용 시 필요)
  priorityLoad?: boolean; // priority(deprecated) 대신 사용
}

export default function AssetImage({
  assetId,
  url,
  alt,
  className,
  wrapperClassName,
  fallback,
  priorityLoad,
  ...props
}: AssetImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isLocalPath = assetId?.startsWith('/');
  const isAlreadyUrl =
    assetId?.startsWith('http://') || assetId?.startsWith('https://');

  // url prop이 있거나 로컬/외부 URL이면 그대로, 아니면 proxy 라우트 사용
  const imageSrc =
    url ||
    (isLocalPath || isAlreadyUrl ? assetId : `/api/media-image/${assetId}`);

  const showFallback = !imageSrc || hasError;

  if (showFallback) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={cn('flex items-center justify-center', className)}>
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  // proxy 라우트는 이미 WebP로 변환해서 반환하므로 _next/image 최적화 불필요
  const isProxyUrl = !!imageSrc?.startsWith('/api/media-image/');

  // fill 모드: 부모가 이미 relative 컨테이너이므로 wrapper 없이 스켈레톤만 sibling으로 렌더링
  if (props.fill) {
    return (
      <>
        {!isLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-white/10 z-10" />
        )}
        <Image
          src={imageSrc}
          alt={alt}
          className={cn(className, !isLoaded && 'opacity-0')}
          unoptimized={isProxyUrl}
          fetchPriority={priorityLoad ? 'high' : undefined}
          loading={priorityLoad ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
          onError={() => { setHasError(true); setIsLoaded(true); }}
          {...props}
        />
      </>
    );
  }

  return (
    <div className={cn('relative overflow-hidden w-full h-full', wrapperClassName)}>
      {/* 로딩 중 스켈레톤 */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-white/10" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        className={cn(className, !isLoaded && 'opacity-0')}
        unoptimized={isProxyUrl}
        fetchPriority={priorityLoad ? 'high' : undefined}
        loading={priorityLoad ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        onError={() => { setHasError(true); setIsLoaded(true); }}
        {...props}
      />
    </div>
  );
}
