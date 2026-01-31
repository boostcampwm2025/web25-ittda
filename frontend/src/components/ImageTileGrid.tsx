'use client';

import AssetImage from './AssetImage';
import { cn } from '@/lib/utils';

interface ImageTileGridProps {
  images: string[];
}

export default function ImageTileGrid({ images }: ImageTileGridProps) {
  if (images.length === 0) return null;

  // 1개: 큰 이미지 (원본 비율, 최대 높이 제한)
  if (images.length === 1) {
    return (
      <div className="w-full rounded-xl overflow-hidden border dark:border-white/10 border-gray-200">
        <div className="w-full max-h-150">
          <AssetImage
            assetId={images[0]}
            url={images[0]}
            alt="이미지"
            width={800}
            height={600}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  // 2개: 2x1 그리드 (나란히)
  if (images.length === 2) {
    return (
      <div className="w-full rounded-xl overflow-hidden border dark:border-white/10 border-gray-200">
        <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-white/10 h-100">
          {images.map((url, index) => (
            <div key={index} className="relative h-full">
              <AssetImage
                assetId={url}
                url={url}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3개: 1개 크게 + 2개 작게 (L자)
  if (images.length === 3) {
    return (
      <div className="w-full rounded-xl overflow-hidden border dark:border-white/10 border-gray-200">
        <div className="grid grid-cols-2 grid-rows-2 gap-px bg-gray-200 dark:bg-white/10 h-100">
          <div className="relative row-span-2">
            <AssetImage
              assetId={images[0]}
              url={images[0]}
              alt="메인 이미지"
              fill
              className="object-cover"
            />
          </div>
          {images.slice(1, 3).map((url, index) => (
            <div key={index} className="relative">
              <AssetImage
                assetId={url}
                url={url}
                alt={`이미지 ${index + 2}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4개: 2x2 그리드
  if (images.length === 4) {
    return (
      <div className="w-full rounded-xl overflow-hidden border dark:border-white/10 border-gray-200">
        <div className="grid grid-cols-2 grid-rows-2 gap-px bg-gray-200 dark:bg-white/10 h-100">
          {images.map((url, index) => (
            <div key={index} className="relative">
              <AssetImage
                assetId={url}
                url={url}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5개 이상: 메인 1개 크게 + 나머지는 작은 그리드
  return (
    <div className="w-full rounded-xl overflow-hidden border dark:border-white/10 border-gray-200">
      <div className="grid grid-cols-4 grid-rows-2 gap-px bg-gray-200 dark:bg-white/10 h-100">
        <div className="relative col-span-2 row-span-2">
          <AssetImage
            assetId={images[0]}
            url={images[0]}
            alt="메인 이미지"
            fill
            className="object-cover"
          />
        </div>
        {images.slice(1, 5).map((url, index) => (
          <div key={index} className="relative">
            <AssetImage
              assetId={url}
              url={url}
              alt={`이미지 ${index + 2}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
        {images.length > 5 && (
          <div className="relative">
            <AssetImage
              assetId={images[5]}
              url={images[5]}
              alt="이미지 6"
              fill
              className="object-cover"
            />
            {images.length > 6 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{images.length - 6}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
