'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoved, setIsMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 50;

    if (translateX > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (translateX < -threshold && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    setTranslateX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setIsMoved(false); // 시작할 때는 이동하지 않은 상태
    setStartX(clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;

    // 5픽셀 이상 움직이면 클릭이 아닌 드래그로 간주
    if (Math.abs(diff) > 5) {
      setIsMoved(true);
    }
    setTranslateX(diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const threshold = 50;

    if (translateX > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (translateX < -threshold && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    setTranslateX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isMoved) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="w-full rounded-xs overflow-hidden">
        <Image
          src={images[0]}
          className="w-full h-auto"
          alt="Image"
          width={800}
          height={800}
        />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div
        ref={containerRef}
        className="w-full rounded-sm overflow-hidden cursor-grab active:cursor-grabbing relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
          }}
        >
          {images.map((url, index) => (
            <div key={index} className="w-full shrink-0 relative aspect-square">
              <Image
                src={url}
                className="select-none pointer-events-none object-cover"
                alt={`Image ${index + 1}`}
                fill
                draggable={false}
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          ))}
        </div>

        {/* 이미지 카운터 */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full z-10">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* 인디케이터 */}
      <div className="flex justify-center gap-1.5 mt-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
            }}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index === currentIndex
                ? 'w-6 bg-gray-900 dark:bg-gray-100'
                : 'w-1.5 bg-gray-300 dark:bg-gray-600',
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
