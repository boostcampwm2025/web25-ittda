'use client';

import Searchbar from '@/components/Searchbar';
import TagButton from '@/components/TagButton';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

interface GoogleMapProps {
  leftPanelWidth: number;
  selectedPostId: number | null;
  onSelectPost: (id: number | null) => void;
}

export default function GoogleMap({
  leftPanelWidth,
  selectedPostId,
  onSelectPost,
}: GoogleMapProps) {
  const filterWidth = leftPanelWidth > 500 ? 500 + 17 : leftPanelWidth + 17;
  const API_KEY = '';

  return (
    <div className="bg-yellow-50 w-full h-full relative">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: 22.54992, lng: 0 }}
          defaultZoom={3}
          gestureHandling="greedy"
          disableDefaultUI
        >
          {/* 마커 추가, 클릭 시 onSelectPost 호출 */}
        </Map>
      </APIProvider>

      <section
        className="absolute top-3.5 right-4.25"
        style={{ left: `${filterWidth}px` }}
      >
        <Searchbar className="w-full" onCalendarClick={() => {}} />
        <div className="flex gap-2.5 mt-2">
          <TagButton onClick={() => {}}>연극</TagButton>
          <TagButton onClick={() => {}}>뮤지컬</TagButton>
          <TagButton onClick={() => {}}>일기/여행</TagButton>
          <TagButton onClick={() => {}}>영화</TagButton>
          <TagButton onClick={() => {}}>기타</TagButton>
        </div>
      </section>
    </div>
  );
}
