'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import AssetImage from './AssetImage';
import { pushBackHandler } from './AndroidBackHandler';

interface ImageCarouselProps {
  images: string[];
  priorityLoad?: boolean;
}

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  // 배경 스크롤 잠금 + Android 뒤로가기 핸들러 등록
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const removeBackHandler = pushBackHandler(onClose);
    return () => {
      document.body.style.overflow = prev;
      removeBackHandler();
    };
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0)
        setCurrentIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1)
        setCurrentIndex((i) => i + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, currentIndex, images.length]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(images.length - 1, index)));
    },
    [images.length],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setTranslateX(e.touches[0].clientX - startXRef.current);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX > 60 && currentIndex > 0) goTo(currentIndex - 1);
    else if (translateX < -60 && currentIndex < images.length - 1)
      goTo(currentIndex + 1);
    setTranslateX(0);
  };

  const content = (
    <div
      className="fixed inset-0 z-9999 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* 헤더: fixed 요소는 body padding-top 미적용 → CSS 변수로 직접 safe area 확보 */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          paddingTop:
            'calc(var(--cap-status-bar-height, env(safe-area-inset-top, 0px)) + 0.75rem)',
          paddingBottom: '0.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 이미지 영역 */}
      <div
        className="flex-1 flex items-center overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex w-full h-full"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {images.map((url, index) => (
            <div
              key={index}
              className="w-full h-full shrink-0 flex items-center justify-center px-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`이미지 ${index + 1}`}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* 이전/다음 버튼 (데스크탑) */}
        {currentIndex > 0 && (
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="absolute left-2 w-9 h-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors hidden sm:flex"
            aria-label="이전 이미지"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-2 w-9 h-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors hidden sm:flex"
            aria-label="다음 이미지"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* 인디케이터: 하단 safe area 확보 */}
      {images.length > 1 && (
        <div
          className="flex justify-center gap-1.5 shrink-0"
          style={{
            paddingTop: '1rem',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30',
              )}
              aria-label={`${index + 1}번째 이미지`}
            />
          ))}
        </div>
      )}
    </div>
  );

  // createPortal로 document.body에 마운트 — 캐러셀 React 트리 외부이므로
  // X 버튼 클릭 이벤트가 캐러셀의 onClick(handleImageClick)으로 버블링되지 않음
  return createPortal(content, document.body);
}

export default function ImageCarousel({ images, priorityLoad }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoved, setIsMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsMoved(false);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    if (Math.abs(diff) > 5) setIsMoved(true);
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 50;
    if (translateX > threshold && currentIndex > 0)
      setCurrentIndex(currentIndex - 1);
    else if (translateX < -threshold && currentIndex < images.length - 1)
      setCurrentIndex(currentIndex + 1);
    setTranslateX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsMoved(false);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 5) setIsMoved(true);
    setTranslateX(diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const threshold = 50;
    if (translateX > threshold && currentIndex > 0)
      setCurrentIndex(currentIndex - 1);
    else if (translateX < -threshold && currentIndex < images.length - 1)
      setCurrentIndex(currentIndex + 1);
    setTranslateX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) handleMouseUp();
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isMoved) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isMoved) {
      e.stopPropagation();
      setLightboxIndex(currentIndex);
    }
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <>
        <div
          className="w-full aspect-square rounded-sm overflow-hidden border dark:border-white/10 border-gray-100 cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex(0);
          }}
        >
          <AssetImage
            assetId={images[0]}
            alt="게시글 이미지"
            width={780}
            height={780}
            draggable={false}
            unoptimized={true}
            sizes="(max-width: 768px) 100vw, 800px"
            className="select-none pointer-events-none w-full h-full object-cover rounded-sm"
            priorityLoad={priorityLoad}
          />
        </div>
        {lightboxIndex !== null && (
          <ImageLightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="w-full relative">
        <div
          ref={containerRef}
          className="w-full rounded-sm overflow-hidden cursor-grab active:cursor-grabbing relative border dark:border-white/10 border-gray-100"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClickCapture={handleClickCapture}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleImageClick}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
            }}
          >
            {images.map((url, index) => (
              <div
                key={index}
                className="flex overflow-hidden justify-center items-center w-full shrink-0 relative aspect-square"
              >
                <AssetImage
                  assetId={url}
                  url={url}
                  alt={`게시글 ${index + 1}번째`}
                  width={780}
                  height={780}
                  draggable={false}
                  unoptimized={true}
                  className="w-full h-full select-none pointer-events-none object-cover"
                  priorityLoad={priorityLoad && index === 0}
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
              onClick={() => setCurrentIndex(index)}
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

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
