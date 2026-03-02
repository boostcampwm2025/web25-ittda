'use client';

import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AssetImageProps extends Omit<ImageProps, 'src'> {
  assetId: string; // solve 해야할 ID
  url?: string; // 직접 solve 완료한 URL
  fallback?: React.ReactNode;
}

export default function AssetImage({
  assetId,
  url,
  alt,
  className,
  fallback,
  ...props
}: AssetImageProps) {
  const [hasError, setHasError] = useState(false);

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

  return (
    <Image
      src={imageSrc}
      alt={alt}
      className={className}
      unoptimized={isProxyUrl}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
