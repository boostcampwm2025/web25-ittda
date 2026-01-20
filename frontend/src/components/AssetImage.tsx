'use client';

import Image, { ImageProps } from 'next/image';
import { ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApiQuery } from '@/hooks/useApi';

interface AssetUrlResponse {
  url: string;
}

interface AssetImageProps extends Omit<ImageProps, 'src'> {
  assetId: string;
  fallback?: React.ReactNode;
}

export default function AssetImage({
  assetId,
  alt,
  className,
  fallback,
  ...props
}: AssetImageProps) {
  const { data, isLoading, isError } = useApiQuery<AssetUrlResponse>(
    ['asset', assetId],
    `/api/assets/${assetId}`,
    {
      enabled: !!assetId,
      staleTime: 1000 * 60 * 60, // 1시간 동안 fresh
      gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 유지
    },
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          className,
        )}
      >
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (isError || !data?.url) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          className,
        )}
      >
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return <Image src={data.url} alt={alt} className={className} {...props} />;
}
