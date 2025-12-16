// app/map/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPostsByBbox } from "@/_lib/api/posts";

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
    <pre className="text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
