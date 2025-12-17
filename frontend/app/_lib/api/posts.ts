import type { PostListItem } from "../types/post"; // 너희 경로에 맞게

export type Bbox = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export type PostsByBboxResponse = {
  meta: { bbox: Bbox; count: number }; // bbox 타입도 있으면 넣고
  items: PostListItem[];
};

export async function fetchPostsByBbox(bbox: Bbox): Promise<PostsByBboxResponse> {  
  const bboxStr = `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`;
  const res = await fetch(`/posts?bbox=${bboxStr}&limit=50`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}
