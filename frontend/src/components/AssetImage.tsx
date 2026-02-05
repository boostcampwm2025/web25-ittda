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
  // assetId가 로컬 경로(/로 시작) 또는 이미 URL인지 확인
  const isLocalPath = assetId?.startsWith('/');
  const isAlreadyUrl =
    assetId?.startsWith('http://') || assetId?.startsWith('https://');

  //url이 없고 로컬 경로나 URL이 아닐 때만 assetId로 solve 호출하기
  const { data, isLoading, isError } = useMediaResolveSingle(
    url || isLocalPath || isAlreadyUrl ? undefined : assetId,
    draftId,
  );
  const imageSrc =
    url || (isLocalPath ? assetId : isAlreadyUrl ? assetId : data?.url);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (isError || !imageSrc) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={cn('flex items-center justify-center', className)}>
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      unoptimized={true}
      alt={alt}
      className={className}
      {...props}
    />
  );
}
