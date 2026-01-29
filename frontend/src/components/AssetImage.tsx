'use client';

import Image, { ImageProps } from 'next/image';
import { ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaResolveSingle } from '@/hooks/useMediaResolve';

interface AssetImageProps extends Omit<ImageProps, 'src'> {
  assetId: string; // solve 해야할 ID
  url?: string; // 직접 solve 완료한 URL
  draftId?: string; // TODO: 명세서에 있어서 추가함, 필요없을 시 삭제
  fallback?: React.ReactNode;
}

export default function AssetImage({
  assetId,
  url,
  draftId,
  alt,
  className,
  fallback,
  ...props
}: AssetImageProps) {
  //url이 없을 때만 assetId로 solve 호출하기
  const { data, isLoading, isError } = useMediaResolveSingle(
    url ? undefined : assetId,
    draftId,
  );
  const imageSrc = url || data?.url;

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

  if (isError || !imageSrc) {
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

  return <Image src={imageSrc} alt={alt} className={className} {...props} />;
}
