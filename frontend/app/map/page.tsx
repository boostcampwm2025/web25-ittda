// app/map/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPostsByBbox } from "@/_lib/api/posts";
import { APIProvider, Map } from '@vis.gl/react-google-maps';

export default function MapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["posts", "test"],
    queryFn: () =>
      fetchPostsByBbox({
        minLat: 37.4,
        minLng: 126.8,
        maxLat: 37.7,
        maxLng: 127.2,
      }),
  });

  if (isLoading) return <div>로딩중...</div>;

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Map
          defaultCenter={{ lat: 37.5665, lng: 126.9780 }}
          defaultZoom={10}
        />
      </div>
    </APIProvider>
  );

}
