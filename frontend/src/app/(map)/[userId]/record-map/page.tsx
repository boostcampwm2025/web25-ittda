'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPostsByBbox } from '@/lib/api/posts';
import GoogleMap from '../../_components/GoogleMap';
import ListPanel from '../../_components/ListPanel';

type Bbox = { minLat: number; minLng: number; maxLat: number; maxLng: number };

// 1) 일단 임시 bbox (서울 근처)
// 다음 단계에서 "지도 bounds → bbox"로 바꿀 것
const TEST_BBOX: Bbox = {
  minLat: 37.4,
  minLng: 126.8,
  maxLat: 37.7,
  maxLng: 127.2,
};

export default function RecordMapPage() {
  const [leftWidth, setLeftWidth] = useState(400); // 데스크톱 너비
  const [bottomHeight, setBottomHeight] = useState(400); // 모바일 높이
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const containerRect = containerRef.current.getBoundingClientRect();

      if (isMobile) {
        // 모바일: 하단에서부터의 높이 계산
        const newHeight = containerRect.bottom - clientY;
        const maxHeight = window.innerHeight - 100;
        if (newHeight >= 150 && newHeight <= maxHeight) {
          setBottomHeight(newHeight);
        }
      } else {
        // 데스크톱: 좌측에서부터의 너비 계산
        const newWidth = clientX - containerRect.left;
        const maxWidth = containerRect.width - 100;
        if (newWidth >= 300 && newWidth <= maxWidth) {
          setLeftWidth(newWidth);
        }
      }
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleEnd);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isMobile]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', 'bbox', TEST_BBOX],
    queryFn: () => fetchPostsByBbox(TEST_BBOX),
    // items만 뽑아 쓰면 페이지가 편해짐
    select: (res) => res.items,
  });

  const posts = data ?? [];

  return (
    <main
      ref={containerRef}
      className="w-full h-full flex relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <GoogleMap
          leftPanelWidth={isMobile ? 0 : leftWidth}
          posts={posts}
          selectedPostId={selectedPostId}
          onSelectPost={setSelectedPostId}
          isMobile={isMobile}
        />
      </div>

      <div
        className={`absolute left-0 bg-white shadow-2xl ${
          isMobile
            ? 'bottom-0 w-full rounded-t-3xl border-t border-gray-200'
            : 'top-0 h-full border-r border-gray-100'
        }`}
        style={{
          width: isMobile ? '100%' : `${leftWidth}px`,
          height: isMobile ? `${bottomHeight}px` : '100%',
        }}
      >
        <ListPanel
          posts={posts}
          selectedPostId={selectedPostId}
          onSelectPost={setSelectedPostId}
          onStartDrag={() => setIsDragging(true)}
          isMobile={isMobile}
        />
      </div>
    </main>
  );
}
