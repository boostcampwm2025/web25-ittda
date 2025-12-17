// app/map/page.tsx
'use client';

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useQuery } from '@tanstack/react-query';
import { fetchPostsByBbox } from '@/_lib/api/posts';

export default function MapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'test'],
    queryFn: () =>
      fetchPostsByBbox({
        minLat: 37.4,
        minLng: 126.8,
        maxLat: 37.7,
        maxLng: 127.2,
      }),
  });

  const posts = data?.items ?? [];
  console.log('query data:', data);

  if (isLoading) return <div>로딩중...</div>;

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Map
          defaultCenter={{ lat: 37.5665, lng: 126.9780 }}
          defaultZoom={12}
          className="w-full h-full"
        >
          {posts?.map((post) => (
            <Marker
              key={post.id}
              position={{ lat: post.lat, lng: post.lng }}
            />
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
