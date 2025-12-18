'use client';

import { useState, useRef, useEffect } from 'react';
import GoogleMap from '../../_components/GoogleMap';
import ListPanel from '../../_components/ListPanel';

export default function RecordMapPage() {
  const [leftWidth, setLeftWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      const maxWidth = containerRect.width - 100;
      if (newWidth >= 300 && newWidth <= maxWidth) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', 'bbox', TEST_BBOX],
    queryFn: () => fetchPostsByBbox(TEST_BBOX),
    // items만 뽑아 쓰면 페이지가 편해짐
    select: (res) => res.items,
  });

  const posts = data ?? [];

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  if (isLoading) return <div>로딩중...</div>;
  if (isError) return <div>데이터 로드 실패</div>;

  return (
    <main ref={containerRef} className="w-full h-full flex relative">
      {/* 지도 - 전체 배경 (고정) */}
      <div className="absolute inset-0">
        <GoogleMap
          leftPanelWidth={leftWidth}
          selectedPostId={selectedPostId}
          onSelectPost={setSelectedPostId}
        />
      </div>

      {/* 리스트 패널 - 지도 위 오버레이 (리사이즈 가능) */}
      <div
        className="relative h-full bg-white shadow-lg z-10"
        style={{ width: `${leftWidth}px` }}
      >
        <ListPanel
          selectedPostId={selectedPostId}
          onSelectPost={setSelectedPostId}
          onStartDrag={() => setIsDragging(true)}
        />
      </div>
    </main>
  );
}
